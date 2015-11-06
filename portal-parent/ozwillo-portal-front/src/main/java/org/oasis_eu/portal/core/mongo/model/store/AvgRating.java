package org.oasis_eu.portal.core.mongo.model.store;

import org.oasis_eu.portal.core.model.catalog.CatalogEntryType;

/**
 * User: schambon
 * Date: 10/31/14
 */
public class AvgRating {
	CatalogEntryType appType;
	String appId;
	float rating;

	public CatalogEntryType getAppType() {
		return appType;
	}

	public void setAppType(CatalogEntryType appType) {
		this.appType = appType;
	}

	public String getAppId() {
		return appId;
	}

	public void setAppId(String appId) {
		this.appId = appId;
	}

	public float getRating() {
		return rating;
	}

	public void setRating(float rating) {
		this.rating = rating;
	}
}
