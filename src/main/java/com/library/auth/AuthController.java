package com.library.auth;

import com.library.dao.MemberDAO;
import com.library.model.Member;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

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
        String name     = body.get("name");
        String email    = body.get("email");
        String password = body.get("password");
        String phone    = body.get("phone");

        if (userDAO.findByEmail(email) != null) {
            return ResponseEntity.badRequest().body("Email already registered.");
        }

        // Create member record
        Member member = new Member(name, email, phone);
        memberDAO.add(member);

        // Get the new member's ID
        Member saved = memberDAO.findByEmail(email);

        // Create user account
        User user = new User();
        user.setName    (name);
        user.setEmail   (email);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole    ("MEMBER");
        user.setMemberId(saved.getId());
        userDAO.save(user);

        return ResponseEntity.ok("Registration successful! Please login.");
    }
}
