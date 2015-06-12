package org.oasis_eu.portal.core.services.sitemap;

import java.util.List;

import org.oasis_eu.portal.core.mongo.model.sitemap.SiteMap;
import org.oasis_eu.portal.core.mongo.model.sitemap.SiteMapMenuSet;
import org.oasis_eu.portal.core.services.sitemap.xml.Footer;
import org.oasis_eu.portal.core.services.sitemap.xml.HeaderMenuSet;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

/**
 * User: schambon
 * Date: 1/13/15
 */
@Service
public class SiteMapUpdater {

    private static final Logger logger = LoggerFactory.getLogger(SiteMapUpdater.class);

    @Autowired
    private SiteMapService siteMapService;

    @Value("${web.sitemap.url_header}")
    private String sitemapUrlHeader;

    @Value("${web.sitemap.url_footer}")
    private String sitemapUrlFooter;

    @Autowired
    @Qualifier("xmlAwareRestTemplate")
    private RestTemplate restTemplate;


    @Scheduled(cron = "${web.sitemap.refresh}")
    public void reload() {
        logger.info("Reloading site map: Header, Footer");
        reloadHeader();
        reloadFooter();
    }

    public void reloadHeader() {
        // Loads and updates the header from xml resource
        try{
            List<SiteMapMenuSet> menuset = restTemplate.getForObject(sitemapUrlHeader, HeaderMenuSet.class).getMenuset();
            menuset.forEach(menu -> siteMapService.updateSiteMapHeader(menu.getLanguage(), menu));
            logger.debug("Header Loaded!");
        }catch(RestClientException rce){
            logger.error("The Header file was not Loaded due to error: " + rce );
        }

    }

    public void reloadFooter() {
        // Loads and updates the footer from xml resource
        try{
            List<SiteMap> menuset = restTemplate.getForObject(sitemapUrlFooter, Footer.class).getMenuset();
            menuset.forEach(menu -> siteMapService.updateSiteMapFooter(menu.getLanguage(), menu));
            logger.debug("Footer Loaded!");
        }catch(RestClientException rce){
            logger.error("The Footer file was not Loaded due to error: " + rce);
        }
    }

}
