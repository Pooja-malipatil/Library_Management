package com.library.dao;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import com.library.model.Media;

@Repository
public class MediaDAO {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private RowMapper<Media> rowMapper = (rs, rowNum) -> {
        Media m = new Media();
        m.setId(rs.getInt("id"));
        m.setTitle(rs.getString("title"));
        m.setCreator(rs.getString("creator"));
        m.setMediaType(rs.getString("media_type"));
        m.setGenre(rs.getString("genre"));
        m.setReleaseYear(rs.getInt("release_year"));
        m.setTotalCopies(rs.getInt("total_copies"));
        m.setAvailable(rs.getInt("available"));
        return m;
    };

    public List<Media> getAll() {
        return jdbcTemplate.query("SELECT * FROM media ORDER BY media_type, title", rowMapper);
    }

    public Media findById(int id) {
        List<Media> list = jdbcTemplate.query("SELECT * FROM media WHERE id = ?", rowMapper, id);
        return list.isEmpty() ? null : list.get(0);
    }

    public List<Media> search(String keyword) {
        String pattern = "%" + keyword + "%";
        return jdbcTemplate.query(
            "SELECT * FROM media WHERE title LIKE ? OR creator LIKE ?",
            rowMapper, pattern, pattern);
    }

    public List<Media> getByType(String type) {
        return jdbcTemplate.query(
            "SELECT * FROM media WHERE media_type = ?",
            rowMapper, type);
    }

    public int add(Media m) {
        return jdbcTemplate.update(
            "INSERT INTO media (title, creator, media_type, genre, release_year, total_copies, available) VALUES (?,?,?,?,?,?,?)",
            m.getTitle(), m.getCreator(), m.getMediaType(), m.getGenre(),
            m.getReleaseYear(), m.getTotalCopies(), m.getTotalCopies());
    }

    public boolean decrementAvailable(int id) {
        return jdbcTemplate.update(
            "UPDATE media SET available = available - 1 WHERE id = ? AND available > 0", id) > 0;
    }

    public boolean incrementAvailable(int id) {
        return jdbcTemplate.update(
            "UPDATE media SET available = available + 1 WHERE id = ? AND available < total_copies", id) > 0;
    }
    public int delete(int id) {
    return jdbcTemplate.update("DELETE FROM media WHERE id = ?", id);
    }
    public int update(Media m) {
        return jdbcTemplate.update(
        "UPDATE media SET title=?, creator=?, media_type=?, genre=?, release_year=?, total_copies=? WHERE id=?",
        m.getTitle(), m.getCreator(), m.getMediaType(), m.getGenre(),
        m.getReleaseYear(), m.getTotalCopies(), m.getId());
    }

}