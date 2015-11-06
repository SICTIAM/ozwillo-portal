package org.oasis_eu.portal.front.home;

import javax.servlet.http.HttpServletRequest;

import org.oasis_eu.portal.front.generic.PortalController;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.support.RequestContextUtils;

/**
 * User: schambon
 * Date: 5/13/14
 */
@Controller
public class HomeController extends PortalController {

	@Value("${web.home}")
	private String webHome;

	@RequestMapping("/")
	public ResponseEntity<?> index(HttpServletRequest request) {
		HttpHeaders headers = new HttpHeaders();
		headers.add("Location", webHome + "/" + RequestContextUtils.getLocale(request).getLanguage());

		ResponseEntity<?> response = new ResponseEntity<>(headers, HttpStatus.MOVED_PERMANENTLY);
		return response;
	}

}
