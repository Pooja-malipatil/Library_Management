package com.library.dao;

import com.library.model.Media;
import com.library.util.DBConnection;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * DAO for media inventory.
 * Uses PreparedStatement parameter mapping to prevent SQL injection — resume bullet 3.
 * Handles real-time inventory adjustments — resume bullet 2.
 */
public class MediaDAO {

    // ── Add new media item ────────────────────────────────
    public void addMedia(Media m) throws SQLException {
        String sql = "INSERT INTO media (title, creator, media_type, genre, release_year, total_copies, available) "
                   + "VALUES (?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, m.getTitle());
            ps.setString(2, m.getCreator());
            ps.setString(3, m.getMediaType());
            ps.setString(4, m.getGenre());
            ps.setInt   (5, m.getReleaseYear());
            ps.setInt   (6, m.getTotalCopies());
            ps.setInt   (7, m.getAvailable());
            ps.executeUpdate();
            ResultSet keys = ps.getGeneratedKeys();
            if (keys.next()) m.setId(keys.getInt(1));
        }
    }

    // ── View all media ────────────────────────────────────
    public List<Media> getAllMedia() throws SQLException {
        List<Media> list = new ArrayList<>();
        String sql = "SELECT * FROM media ORDER BY media_type, title";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) list.add(mapRow(rs));
        }
        return list;
    }

    // ── Search by title or creator ────────────────────────
    public List<Media> searchMedia(String keyword) throws SQLException {
        List<Media> list = new ArrayList<>();
        String sql = "SELECT * FROM media WHERE title LIKE ? OR creator LIKE ? ORDER BY title";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            String pattern = "%" + keyword + "%";
            ps.setString(1, pattern);
            ps.setString(2, pattern);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) list.add(mapRow(rs));
            }
        }
        return list;
    }

    // ── Filter by media type ──────────────────────────────
    public List<Media> getByType(String mediaType) throws SQLException {
        List<Media> list = new ArrayList<>();
        String sql = "SELECT * FROM media WHERE media_type = ? ORDER BY title";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, mediaType);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) list.add(mapRow(rs));
            }
        }
        return list;
    }

    // ── Decrease available count on borrow ───────────────
    public boolean decrementAvailable(int mediaId) throws SQLException {
        String sql = "UPDATE media SET available = available - 1 "
                   + "WHERE id = ? AND available > 0";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, mediaId);
            return ps.executeUpdate() > 0;
        }
    }

    // ── Increase available count on return ───────────────
    public boolean incrementAvailable(int mediaId) throws SQLException {
        String sql = "UPDATE media SET available = available + 1 "
                   + "WHERE id = ? AND available < total_copies";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, mediaId);
            return ps.executeUpdate() > 0;
        }
    }

    // ── Find by ID ────────────────────────────────────────
    public Media findById(int id) throws SQLException {
        String sql = "SELECT * FROM media WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? mapRow(rs) : null;
            }
        }
    }

    // ── Map ResultSet row → Media object ─────────────────
    private Media mapRow(ResultSet rs) throws SQLException {
        Media m = new Media();
        m.setId          (rs.getInt   ("id"));
        m.setTitle       (rs.getString("title"));
        m.setCreator     (rs.getString("creator"));
        m.setMediaType   (rs.getString("media_type"));
        m.setGenre       (rs.getString("genre"));
        m.setReleaseYear (rs.getInt   ("release_year"));
        m.setTotalCopies (rs.getInt   ("total_copies"));
        m.setAvailable   (rs.getInt   ("available"));
        return m;
    }
}
