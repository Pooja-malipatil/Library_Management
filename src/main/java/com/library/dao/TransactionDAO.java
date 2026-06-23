package com.library.dao;

import com.library.model.Transaction;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class TransactionDAO {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private RowMapper<Transaction> rowMapper = (rs, rowNum) -> {
        Transaction t = new Transaction();
        t.setId(rs.getInt("id"));
        t.setMemberId(rs.getInt("member_id"));
        t.setMediaId(rs.getInt("media_id"));
        t.setBorrowDate(rs.getTimestamp("borrow_date").toLocalDateTime());
        t.setDueDate(rs.getDate("due_date").toLocalDate());
        if (rs.getTimestamp("return_date") != null)
            t.setReturnDate(rs.getTimestamp("return_date").toLocalDateTime());
        t.setStatus(rs.getString("status"));
        try { t.setMemberName(rs.getString("member_name")); } catch (Exception ignored) {}
        try { t.setMediaTitle(rs.getString("media_title")); } catch (Exception ignored) {}
        return t;
    };

    public List<Transaction> getAll() {
        return jdbcTemplate.query(
            "SELECT t.*, m.name AS member_name, md.title AS media_title " +
            "FROM transactions t " +
            "JOIN members m ON t.member_id = m.id " +
            "JOIN media md ON t.media_id = md.id " +
            "ORDER BY t.borrow_date DESC", rowMapper);
    }

    public List<Transaction> getActiveByMember(int memberId) {
        return jdbcTemplate.query(
            "SELECT t.*, m.name AS member_name, md.title AS media_title " +
            "FROM transactions t " +
            "JOIN members m ON t.member_id = m.id " +
            "JOIN media md ON t.media_id = md.id " +
            "WHERE t.member_id = ? AND t.status = 'BORROWED'", rowMapper, memberId);
    }

    public Transaction findById(int id) {
        List<Transaction> list = jdbcTemplate.query(
            "SELECT t.*, m.name AS member_name, md.title AS media_title " +
            "FROM transactions t " +
            "JOIN members m ON t.member_id = m.id " +
            "JOIN media md ON t.media_id = md.id " +
            "WHERE t.id = ?", rowMapper, id);
        return list.isEmpty() ? null : list.get(0);
    }

    public int add(int memberId, int mediaId, java.time.LocalDate dueDate) {
        return jdbcTemplate.update(
            "INSERT INTO transactions (member_id, media_id, due_date, status) VALUES (?,?,?,'BORROWED')",
            memberId, mediaId, dueDate);
    }

    public int recordReturn(int id) {
        return jdbcTemplate.update(
            "UPDATE transactions SET return_date = NOW(), status = 'RETURNED' WHERE id = ? AND status = 'BORROWED'", id);
    }

    public int markOverdue() {
        return jdbcTemplate.update(
            "UPDATE transactions SET status = 'OVERDUE' WHERE due_date < CURDATE() AND status = 'BORROWED'");
    }
}