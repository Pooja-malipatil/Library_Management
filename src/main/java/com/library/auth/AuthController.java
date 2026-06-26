package com.library.auth;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.library.dao.MemberDAO;
import com.library.model.Member;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired private UserDAO         userDAO;
    @Autowired private JwtUtil         jwtUtil;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private MemberDAO       memberDAO;

    // ── Login ─────────────────────────────────────────────
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email    = body.get("email");
        String password = body.get("password");

        User user = userDAO.findByEmail(email);
        if (user == null || !passwordEncoder.matches(password, user.getPassword())) {
            return ResponseEntity.status(401).body("Invalid email or password.");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole());

        Map<String, Object> response = new HashMap<>();
        response.put("token",    token);
        response.put("role",     user.getRole());
        response.put("name",     user.getName());
        response.put("email",    user.getEmail());
        response.put("memberId", user.getMemberId());
        return ResponseEntity.ok(response);
    }

    // ── Register Member ───────────────────────────────────
    @PostMapping("/register")
public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
    try {
        String name     = body.get("name");
        String email    = body.get("email");
        String password = body.get("password");
        String phone    = body.get("phone");

        if (name == null || email == null || password == null || phone == null) {
            return ResponseEntity.badRequest().body("All fields are required.");
        }

        if (userDAO.findByEmail(email) != null) {
            return ResponseEntity.badRequest().body("Email already registered.");
        }

        // Create member record
        Member member = new Member();
        member.setName (name);
        member.setEmail(email);
        member.setPhone(phone);
        memberDAO.add(member);

        // Get the new member's ID
        Member saved = memberDAO.findByEmail(email);
        if (saved == null) {
            return ResponseEntity.status(500).body("Could not create member record.");
        }

        // Create user account
        User user = new User();
        user.setName    (name);
        user.setEmail   (email);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole    ("MEMBER");
        user.setMemberId(saved.getId());
        userDAO.save(user);

        return ResponseEntity.ok("Registration successful! Please login.");
    } catch (Exception e) {
        return ResponseEntity.status(500).body("Error: " + e.getMessage());
    }
}
}
