package com.library.dao;

import com.library.model.Transaction;
import com.library.util.DBConnection;

import java.sql.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * DAO for the transaction ledger.
 * Records transactional logging with PreparedStatements — resume bullet 2 & 3.
 */
public class TransactionDAO {

    // ── Record a new borrow ───────────────────────────────
    public void addTransaction(Transaction t) throws SQLException {
        String sql = "INSERT INTO transactions (member_id, media_id, due_date, status) VALUES (?, ?, ?, 'BORROWED')";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt (1, t.getMemberId());
            ps.setInt (2, t.getMediaId());
            ps.setDate(3, Date.valueOf(t.getDueDate()));
            ps.executeUpdate();
            ResultSet keys = ps.getGeneratedKeys();
            if (keys.next()) t.setId(keys.getInt(1));
        }
    }

    // ── Record a return (update existing txn) ────────────
    public boolean recordReturn(int transactionId) throws SQLException {
        String sql = "UPDATE transactions SET return_date = NOW(), status = 'RETURNED' "
                   + "WHERE id = ? AND status = 'BORROWED'";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, transactionId);
            return ps.executeUpdate() > 0;
        }
    }

    // ── View all active borrows for a member ──────────────
    public List<Transaction> getActiveByMember(int memberId) throws SQLException {
        List<Transaction> list = new ArrayList<>();
        String sql = "SELECT t.*, m.name AS member_name, md.title AS media_title "
                   + "FROM transactions t "
                   + "JOIN members m  ON t.member_id = m.id "
                   + "JOIN media md   ON t.media_id  = md.id "
                   + "WHERE t.member_id = ? AND t.status = 'BORROWED' "
                   + "ORDER BY t.borrow_date DESC";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, memberId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) list.add(mapRow(rs));
            }
        }
        return list;
    }

    // ── View full ledger (all transactions) ───────────────
    public List<Transaction> getAllTransactions() throws SQLException {
        List<Transaction> list = new ArrayList<>();
        String sql = "SELECT t.*, m.name AS member_name, md.title AS media_title "
                   + "FROM transactions t "
                   + "JOIN members m  ON t.member_id = m.id "
                   + "JOIN media md   ON t.media_id  = md.id "
                   + "ORDER BY t.borrow_date DESC";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) list.add(mapRow(rs));
        }
        return list;
    }

    // ── Mark overdue transactions ─────────────────────────
    public int markOverdue() throws SQLException {
        String sql = "UPDATE transactions SET status = 'OVERDUE' "
                   + "WHERE due_date < CURDATE() AND status = 'BORROWED'";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            return ps.executeUpdate();
        }
    }

    // ── Find transaction by ID ────────────────────────────
    public Transaction findById(int id) throws SQLException {
        String sql = "SELECT t.*, m.name AS member_name, md.title AS media_title "
                   + "FROM transactions t "
                   + "JOIN members m  ON t.member_id = m.id "
                   + "JOIN media md   ON t.media_id  = md.id "
                   + "WHERE t.id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? mapRow(rs) : null;
            }
        }
    }

    // ── Map ResultSet row → Transaction object ────────────
    private Transaction mapRow(ResultSet rs) throws SQLException {
        Transaction t = new Transaction();
        t.setId        (rs.getInt      ("id"));
        t.setMemberId  (rs.getInt      ("member_id"));
        t.setMediaId   (rs.getInt      ("media_id"));
        t.setBorrowDate(rs.getTimestamp("borrow_date"));
        Date due = rs.getDate("due_date");
        if (due != null) t.setDueDate(due.toLocalDate());
        t.setReturnDate(rs.getTimestamp("return_date"));
        t.setStatus    (rs.getString   ("status"));
        t.setMemberName(rs.getString   ("member_name"));
        t.setMediaTitle(rs.getString   ("media_title"));
        return t;
    }
}
