package org.oasis_eu.portal.core.mongo.model.sitemap;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlElementWrapper;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlProperty;

/**
 * User: lucaterori
 * Date: 08/06/2015
 */
@Document(collection = "sitemapheader")
public class SiteMapMenuSet implements Serializable {
	private static final long serialVersionUID = -6572421288637503651L;

	@Id
	@JsonIgnore
	private String id;

	@Indexed(unique = true)
	@JacksonXmlProperty(localName = "locale")
	private String language;

	@JacksonXmlElementWrapper(useWrapping = false)
	@JacksonXmlProperty(localName = "item")
	private List<SiteMapMenuItem> items = new ArrayList<>();

	@JacksonXmlElementWrapper(useWrapping = false)
	@JacksonXmlProperty(localName = "submenu")
	private List<SiteMapSubMenuEntry> submenus = new ArrayList<>();


	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getLanguage() {
		return language;
	}

	public void setLanguage(String language) {
		this.language = language;
	}

	public List<SiteMapMenuItem> getItems() {
		return items;
	}

	public void setItems(List<SiteMapMenuItem> items) {
		this.items = items;
	}

	public List<SiteMapSubMenuEntry> getSubmenus() {
		return submenus;
	}

	public void setSubmenus(List<SiteMapSubMenuEntry> submenus) {
		this.submenus = submenus;
	}
}
