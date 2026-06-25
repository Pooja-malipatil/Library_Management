package com.library.auth;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public class UserDAO {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private RowMapper<User> rowMapper = (rs, rowNum) -> {
        User u = new User();
        u.setId      (rs.getInt   ("id"));
        u.setName    (rs.getString("name"));
        u.setEmail   (rs.getString("email"));
        u.setPassword(rs.getString("password"));
        u.setRole    (rs.getString("role"));
        int mid = rs.getInt("member_id");
        if (!rs.wasNull()) u.setMemberId(mid);
        return u;
    };

    public User findByEmail(String email) {
        List<User> list = jdbcTemplate.query(
            "SELECT * FROM users WHERE email = ?", rowMapper, email);
        return list.isEmpty() ? null : list.get(0);
    }

    public void save(User u) {
        jdbcTemplate.update(
            "INSERT INTO users (name, email, password, role, member_id) VALUES (?,?,?,?,?)",
            u.getName(), u.getEmail(), u.getPassword(), u.getRole(), u.getMemberId());
    }
}
