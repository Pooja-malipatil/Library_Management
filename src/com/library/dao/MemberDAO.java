package com.library.dao;

import com.library.model.Member;
import com.library.util.DBConnection;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * DAO for library members. Uses PreparedStatements throughout.
 */
public class MemberDAO {

    public void addMember(Member m) throws SQLException {
        String sql = "INSERT INTO members (name, email, phone) VALUES (?, ?, ?)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, m.getName());
            ps.setString(2, m.getEmail());
            ps.setString(3, m.getPhone());
            ps.executeUpdate();
            ResultSet keys = ps.getGeneratedKeys();
            if (keys.next()) m.setId(keys.getInt(1));
        }
    }

    public List<Member> getAllMembers() throws SQLException {
        List<Member> list = new ArrayList<>();
        String sql = "SELECT * FROM members ORDER BY name";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) list.add(mapRow(rs));
        }
        return list;
    }

    public Member findById(int id) throws SQLException {
        String sql = "SELECT * FROM members WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? mapRow(rs) : null;
            }
        }
    }

    public boolean deactivateMember(int id) throws SQLException {
        String sql = "UPDATE members SET is_active = 0 WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            return ps.executeUpdate() > 0;
        }
    }

    private Member mapRow(ResultSet rs) throws SQLException {
        Member m = new Member();
        m.setId    (rs.getInt    ("id"));
        m.setName  (rs.getString ("name"));
        m.setEmail (rs.getString ("email"));
        m.setPhone (rs.getString ("phone"));
        m.setActive(rs.getBoolean("is_active"));
        return m;
    }
}
