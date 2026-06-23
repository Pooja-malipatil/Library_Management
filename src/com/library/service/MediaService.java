package com.library.service;

import com.library.dao.MediaDAO;
import com.library.model.Media;
import com.library.util.InputValidator;

import java.sql.SQLException;
import java.util.List;

/**
 * Business logic layer for media inventory management.
 * Validates input before passing to DAO — separation of concerns.
 */
public class MediaService {

    private final MediaDAO mediaDAO = new MediaDAO();

    public void addMedia(String title, String creator, String mediaType,
                         String genre, String year, String copies) throws SQLException {
        // Input validation (resume bullet 3)
        String  t  = InputValidator.requireNonBlank    (title,     "Title");
        String  c  = InputValidator.requireNonBlank    (creator,   "Creator");
        String  mt = InputValidator.requireValidMediaType(mediaType);
        String  g  = genre != null ? genre.trim() : "";
        int     y  = InputValidator.requireValidYear   (year);
        int     n  = InputValidator.requirePositiveInt (copies,    "Copies");

        Media media = new Media(t, c, mt, g, y, n, n);
        mediaDAO.addMedia(media);
        System.out.println("\n✔ Media added: " + media);
    }

    public void listAllMedia() throws SQLException {
        List<Media> list = mediaDAO.getAllMedia();
        if (list.isEmpty()) { System.out.println("No media in inventory."); return; }
        System.out.println("\n── Media Inventory ──────────────────────────────────────────────────");
        list.forEach(System.out::println);
        System.out.println("Total items: " + list.size());
    }

    public void searchMedia(String keyword) throws SQLException {
        String kw = InputValidator.requireNonBlank(keyword, "Search keyword");
        List<Media> list = mediaDAO.searchMedia(kw);
        if (list.isEmpty()) { System.out.println("No results for: " + kw); return; }
        list.forEach(System.out::println);
    }

    public void listByType(String mediaType) throws SQLException {
        String mt = InputValidator.requireValidMediaType(mediaType);
        List<Media> list = mediaDAO.getByType(mt);
        if (list.isEmpty()) { System.out.println("No items of type: " + mt); return; }
        list.forEach(System.out::println);
    }

    public MediaDAO getDAO() { return mediaDAO; }
}
