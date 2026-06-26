package com.library.dao;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.library.model.Member;

@Repository
public class MemberDAO {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private Member mapRow(java.sql.ResultSet rs, int rowNum) throws java.sql.SQLException {
        Member m = new Member();
        m.setId    (rs.getInt    ("id"));
        m.setName  (rs.getString ("name"));
        m.setEmail (rs.getString ("email"));
        m.setPhone (rs.getString ("phone"));
        m.setActive(rs.getBoolean("is_active"));
        return m;
    }

    public List<Member> getAll() {
        return jdbcTemplate.query("SELECT * FROM members ORDER BY name", this::mapRow);
    }

    public Member findById(int id) {
        List<Member> list = jdbcTemplate.query(
            "SELECT * FROM members WHERE id = ?", this::mapRow, id);
        return list.isEmpty() ? null : list.get(0);
    }

    public Member findByEmail(String email) {
        List<Member> list = jdbcTemplate.query(
            "SELECT * FROM members WHERE email = ?", this::mapRow, email);
        return list.isEmpty() ? null : list.get(0);
    }

    public int add(Member m) {
        return jdbcTemplate.update(
            "INSERT INTO members (name, email, phone) VALUES (?,?,?)",
            m.getName(), m.getEmail(), m.getPhone());
    }

    public int deactivate(int id) {
        return jdbcTemplate.update(
            "UPDATE members SET is_active = 0 WHERE id = ?", id);
    }

    public int delete(int id) {
        return jdbcTemplate.update("DELETE FROM members WHERE id = ?", id);
    }

    public List<Member> search(String keyword) {
        String pattern = "%" + keyword + "%";
        return jdbcTemplate.query(
            "SELECT * FROM members WHERE name LIKE ? OR email LIKE ?",
            this::mapRow, pattern, pattern);
    }
}