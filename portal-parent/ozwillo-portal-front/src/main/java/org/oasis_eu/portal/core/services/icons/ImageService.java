package org.oasis_eu.portal.core.services.icons;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.List;
import java.util.UUID;

import javax.imageio.ImageIO;

import org.apache.tika.Tika;
import org.joda.time.DateTime;
import org.oasis_eu.portal.core.mongo.dao.icons.DirectAccessImageRepo;
import org.oasis_eu.portal.core.mongo.dao.icons.ImageDownloadAttemptRepository;
import org.oasis_eu.portal.core.mongo.dao.icons.ImageRepository;
import org.oasis_eu.portal.core.mongo.model.images.Image;
import org.oasis_eu.portal.core.mongo.model.images.ImageDownloadAttempt;
import org.oasis_eu.portal.core.mongo.model.images.ImageFormat;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoOperations;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;

import com.google.common.base.Strings;

/**
 * User: schambon
 * Date: 8/21/14
 */

@Service
public class ImageService {
	private static final Logger logger = LoggerFactory.getLogger(ImageService.class);

	/** used to build "virtual", not served unique icon URL */
	public static final String ICONIMAGE_NAME = "icon.png";
	/** used to build "virtual", not served unique icon URL */
	public static final String OBJECTICONIMAGE_PATHELEMENT = "objectIcon";

	@Autowired
	private ImageDownloader imageDownloader;

	@Autowired
	private ImageRepository imageRepository;

	@Autowired
	private DirectAccessImageRepo directAccessImageRepo;

	@Autowired
	private ImageDownloadAttemptRepository imageDownloadAttemptRepository;

	/** to avoid writing a custom spring repository for exists(url) only */
	@Autowired
	private MongoOperations mgo;


	@Value("${application.baseImageUrl}")
	private String baseImageUrl;

	@Value("${application.defaultIconUrl}")
	private String defaultIconUrl;


	/**
	 * Allows to store a single image / icon per object to prettify its display
	 * @param objectId id of ex. user service subscription, user...
	 * @param image imageToStore with only bytes (filename will be "icon.png"
	 * @return complete saved image (with also id, hash, servedImageUrl also used as inputUrl...)
	 */
	public Image storeImageForObjectId(String objectId, Image imageToStore) {
		byte[] iconBytes = imageToStore.getBytes();
		if (iconBytes == null || imageToStore.getFilename() == null) {
			throw new RuntimeException("Image must have bytes and name");
		}

		// 1. build servedImageUrl, also used as "proxied" / cached inputUrl
		String servedImageUrl = buildObjectIconImageVirtualUrl(objectId);

		// 2. make sure it is a 64x64 PNG (NB this will change in the future with more intelligent format detection / conversion)
		if (!ensurePNG(iconBytes)) {
			logger.error("Icon URL {} is not a PNG, returning default icon", servedImageUrl);
			throw new RuntimeException("Image must be 64x64 PNG");
		}
		ImageFormat format = getFormat(iconBytes);
		if (format == ImageFormat.INVALID) {
			throw new RuntimeException("Invalid format of image for object " + objectId);
		}

		Image image = imageRepository.findByUrl(servedImageUrl);
		if (image == null) {
			image = imageToStore; // new one
			image.setId(UUID.randomUUID().toString());
		}

		// 3. compute the hash and store the icon
		image.setUrl(servedImageUrl); // servedImageUrl used as inputUrl, required in this collection, guarantees only one image per object
		image.setImageFormat(format);
		image.setFilename(imageToStore.getFilename()); //image.setFilename(ICONIMAGE_NAME);
		image.setBytes(iconBytes);
		image.setHash(getHash(iconBytes));
		image.setDownloadedTime(DateTime.now());

		imageRepository.save(image);

		return image;
	}

	/**
	 * Computes URL where image (business object icon) is served in the case where the original
	 * (be it proxied or uploaded) URL is unavailable because NOT stored in the business object.
	 * To be used only when storing it, otherwise to get image use buildObjectIconImageVirtualUrlOrNullIfNone().
	 * @param objectId of object whose icon we're trying to build the virtual URL
	 * @return URL that is unique for mongo, but not where this image will be served
	 */
	public String buildObjectIconImageVirtualUrl(String objectId) {
		return UriComponentsBuilder.fromHttpUrl(baseImageUrl)
				.path("/")
				.path(OBJECTICONIMAGE_PATHELEMENT)
				.path("/")
				.path(objectId)
				.path("/")
				.path(ICONIMAGE_NAME) // .path(image.getFilename())
				.build()
				.toUriString();
	}

	/**
	 *
	 * @param objectId
	 * @return null if none, allowing caller to rather use business object default url
	 */
	public String buildObjectIconImageVirtualUrlOrNullIfNone(String objectId) {
		String url = buildObjectIconImageVirtualUrl(objectId);
		Image image = mgo.findOne(new Query(new Criteria("url").is(url)), Image.class);
		if (image != null) {
			return this.buildImageServedUrl(image);
		} else {
			return null;
		}
	}

	/**
	 * @param image (only id & filename params are required)
	 * @return URL where this image will be served
	 */
	public String buildImageServedUrl(Image image) {
		return UriComponentsBuilder.fromHttpUrl(baseImageUrl)
				.path("/")
				.path(image.getId())
				.path("/")
				.path(image.getFilename())
				.build()
				.toUriString();
	}

	/**
	 * Retrieves URL where image is served in the case where the original (be it proxied
	 * or uploaded) URL is stored in the business object
	 * @param inputUrl the original (be it proxied or uploaded) URL of the image
	 * @param format
	 * @param force
	 * @return
	 */
	public String getImageForURL(String inputUrl, ImageFormat format, boolean force) {

		if (inputUrl != null && inputUrl.startsWith(baseImageUrl)) {
			// Self-served (Portal object icon) image
			return inputUrl;
			// NB. could also allow to cache portal-served images besides POSTed ones (but for what need ?) :
			/*if (!inputUrl.contains("objectIcon")) { // TODO better parse URI & startsWith
				return inputUrl;
			}
			//throw new RuntimeException("Self-served (Portal object icon) image not found " + inputUrl);*/
		}

		if (imageDownloadAttemptRepository.findByUrl(inputUrl) != null) {
			logger.debug("Image input URL {} is blacklisted, returning default icon", inputUrl);
			return defaultIcon();
		}

		Image image = imageRepository.findByUrl(inputUrl);

		if (image == null || force) {

			// 1. download the icon
			byte[] iconBytes = imageDownloader.download(inputUrl);
			if (iconBytes == null) {
				logger.error("Could not load icon from URL {}, returning default", inputUrl);
				blacklist(inputUrl);
				return defaultIcon();
			}

			// 2. make sure it is a 64x64 PNG (NB this will change in the future with more intelligent format detection / conversion)
			if (!ensurePNG(iconBytes)) {
				logger.error("Icon URL {} is not a PNG, returning default icon", inputUrl);
				blacklist(inputUrl);
				return defaultIcon();
			}
			if (!format.equals(getFormat(iconBytes))) {
				logger.error("Icon URL {} does not point to an image of correct format ({}), returning default icon", inputUrl, format);
				blacklist(inputUrl);
				return defaultIcon();
			}

			// 3. compute the hash and store the icon
			if (image == null) {
				image = new Image();
				image.setId(UUID.randomUUID().toString());
				image.setUrl(inputUrl);
				image.setImageFormat(format);
				image.setFilename(getFileName(inputUrl));
			}
			image.setBytes(iconBytes);
			image.setHash(getHash(iconBytes));
			image.setDownloadedTime(DateTime.now());

			image = imageRepository.save(image);
		}

		return buildImageServedUrl(image);
	}

	public Image getImage(String id) {
		return imageRepository.findOne(id);
	}

	public String getHash(String id) {
		return directAccessImageRepo.getHashForIcon(id);
	}

	@Scheduled(fixedRate = 600000)
	public void refreshOldImages() {
		logger.debug("Refreshing images");

		// every 10 minutes, try to download the 10 oldest images not already downloaded in the last 60 minutes (phew)
		List<Image> images = imageRepository.findByDownloadedTimeBefore(DateTime.now().minusMinutes(60), new PageRequest(0, 10, Sort.Direction.ASC, "downloadedTime"));

		logger.debug("Found {} image(s) to refresh", images.size());

		images.forEach(i -> getImageForURL(i.getUrl(), i.getImageFormat(), true));

	}

	// TODO provide a default for all image formats (eg 800×450)
	private String defaultIcon() {
		return defaultIconUrl;

	}

	public boolean isDefaultIcon(String icon) {
		return defaultIconUrl.equals(icon);
	}

	private String getFileName(String url) {

		if (Strings.isNullOrEmpty(url)) {
			return "";
		}

		if (url.contains("?")) {
			url = url.substring(0, url.indexOf('?'));
		}

		while (url.endsWith("/")) {
			url = stripSlash(url);
		}

		return url.substring(url.lastIndexOf("/") + 1);
	}

	private String stripSlash(String input) {
		if (Strings.isNullOrEmpty(input)) {
			return "";
		} else if (input.endsWith("/")) {
			return input.substring(0, input.length() - 1);
		} else return input;
	}


	private boolean ensurePNG(byte[] array) {
		Tika tika = new Tika();
		try {
			String found = tika.detect(new ByteArrayInputStream(array));
			return "image/png".equals(found);
		} catch (IOException e) {
			logger.error("Image file cannot be analyzed", e);
		}
		return false;
	}

	private ImageFormat getFormat(byte[] image) {
		try {
			BufferedImage bim = ImageIO.read(new ByteArrayInputStream(image));
			if (bim == null) {
				logger.error("Cannot read image");
				return ImageFormat.INVALID;
			}
			int height = bim.getHeight();
			int width = bim.getWidth();

			String formatString = String.format("%sx%s", width, height);

			switch (formatString) {
				case "16x16":
					return ImageFormat.PNG_16BY16;
				case "32x32":
					return ImageFormat.PNG_32BY32;
				case "64x64":
					return ImageFormat.PNG_64BY64;
				case "128x128":
					return ImageFormat.PNG_128BY128;
				case "256x256":
					return ImageFormat.PNG_256BY256;
				case "800x450":
					return ImageFormat.PNG_800BY450;
				default:
					logger.error("Cannot handle image format: {}", formatString);
					return ImageFormat.INVALID;
			}

		} catch (IOException e) {
			logger.error("Cannot read image", e);
			return ImageFormat.INVALID;
		}
	}

	private String getHash(byte[] array) {
		try {
			MessageDigest messageDigest = MessageDigest.getInstance("SHA-256");
			return toHex(messageDigest.digest(array));
		} catch (NoSuchAlgorithmException e) {

			logger.error("Cannot load SHA-256 in this JVM!?", e);
			return toHex(new byte[32]);
		}

	}

	private String toHex(byte[] array) {
		StringBuilder s = new StringBuilder();
		for (byte b : array) {
			s.append(String.format("%02x", b));
		}
		return s.toString();
	}

	private void blacklist(String url) {
		ImageDownloadAttempt attempt = new ImageDownloadAttempt();
		attempt.setTime(DateTime.now());
		attempt.setUrl(url);

		if (imageDownloadAttemptRepository.findByUrl(url) == null) { // checking is overkill, but in case of multiple threads doing the same thing, let's keep it easy
			logger.info("Blacklisting url {}", url);
			imageDownloadAttemptRepository.save(attempt);
		} else {
			logger.warn("Cannot blacklist url {} because it is already present in the collection", url);
		}
	}

}
