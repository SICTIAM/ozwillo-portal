package org.oasis_eu.portal.core.services.icons;

import com.google.common.base.Strings;
import org.apache.tika.Tika;
import org.joda.time.DateTime;
import org.joda.time.Instant;
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
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.List;
import java.util.UUID;

/**
 * User: schambon
 * Date: 8/21/14
 */

@Service
public class ImageService {
    private static final Logger logger = LoggerFactory.getLogger(ImageService.class);

    @Autowired
    private ImageDownloader imageDownloader;

    @Autowired
    private ImageRepository imageRepository;

    @Autowired
    private DirectAccessImageRepo directAccessImageRepo;

    @Autowired
    private ImageDownloadAttemptRepository imageDownloadAttemptRepository;


    @Value("${application.baseImageUrl}")
    private String baseImageUrl;

    @Value("${application.defaultIconUrl}")
    private String defaultIconUrl;

    public String getImageForURL(String inputUrl, ImageFormat format, boolean force) {

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

        return UriComponentsBuilder.fromHttpUrl(baseImageUrl)
                .path("/")
                .path(image.getId())
                .path("/")
                .path(image.getFilename())
                .build()
                .toUriString();
    }

    public Image getImage(String id) {
        return imageRepository.findOne(id);
    }

    public String getHash(String id) {
        return directAccessImageRepo.getHashForIcon(id);
    }

    @Scheduled(fixedRate = 60000)
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

            if (height != width) {
                logger.error("Can only handle square icons, got {}×{}",  width, height);
                return ImageFormat.INVALID;
            }

            switch (height) {
                case 16:
                    return ImageFormat.PNG_16BY16;
                case 32:
                    return ImageFormat.PNG_32BY32;
                case 64:
                    return ImageFormat.PNG_64BY64;
                case 128:
                    return ImageFormat.PNG_128BY128;
                case 256:
                    return ImageFormat.PNG_256BY256;
                default:
                    logger.error("Image has size {}×{} - which is invalid", height, width);
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
        for (byte b: array) {
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
