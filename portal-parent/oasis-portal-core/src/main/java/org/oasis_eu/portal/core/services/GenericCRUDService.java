package org.oasis_eu.portal.core.services;

import org.oasis_eu.portal.core.model.appstore.GenericEntity;

import java.util.List;

/**
 * User: schambon
 * Date: 5/30/14
 */
public interface GenericCRUDService<T extends GenericEntity> {
    T create(T t);

    void update(T t);

    T find(String id);

    List<T> find();

    List<T> find(int skip, int limit);

    void delete(T t);

}

