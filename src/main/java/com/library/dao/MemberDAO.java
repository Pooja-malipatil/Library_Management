package com.library.dao;

import com.library.model.Member;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class MemberDAO {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private RowMapper<Member> rowMapper = (rs, rowNum) -> {
        Member m = new Member();
        m.setId(rs.getInt("id"));
        m.setName(rs.getString("name"));
        m.setEmail(rs.getString("email"));
        m.setPhone(rs.getString("phone"));
        m.setActive(rs.getBoolean("is_active"));
        return m;
    };

    public List<Member> getAll() {
        return jdbcTemplate.query("SELECT * FROM members ORDER BY name", rowMapper);
    }

    public Member findById(int id) {
        List<Member> list = jdbcTemplate.query(
            "SELECT * FROM members WHERE id = ?", rowMapper, id);
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
}