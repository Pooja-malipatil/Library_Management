package com.library.service;

import com.library.dao.MediaDAO;
import com.library.model.Media;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MediaService {

    @Autowired
    private MediaDAO mediaDAO;

    public List<Media> getAll() { return mediaDAO.getAll(); }

    public Media findById(int id) {
        Media m = mediaDAO.findById(id);
        if (m == null) throw new RuntimeException("Media not found with id: " + id);
        return m;
    }

    public List<Media> search(String keyword) { return mediaDAO.search(keyword); }

    public List<Media> getByType(String type) { return mediaDAO.getByType(type); }

    public String addMedia(Media m) {
        if (m.getTitle() == null || m.getTitle().isBlank())
            throw new IllegalArgumentException("Title is required.");
        if (m.getCreator() == null || m.getCreator().isBlank())
            throw new IllegalArgumentException("Creator is required.");
        if (m.getMediaType() == null || m.getMediaType().isBlank())
            throw new IllegalArgumentException("Media type is required.");
        mediaDAO.add(m);
        return "Media added successfully!";
    }
}