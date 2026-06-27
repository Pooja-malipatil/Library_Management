package com.library.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.library.service.TransactionService;

@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = "*")
public class TransactionController {

    @Autowired
    private TransactionService transactionService;

    @GetMapping
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(transactionService.getAll());
    }

    @GetMapping("/member/{memberId}")
    public ResponseEntity<?> getActiveByMember(@PathVariable int memberId) {
        return ResponseEntity.ok(transactionService.getActiveByMember(memberId));
    }

    @PostMapping("/borrow")
    public ResponseEntity<?> borrow(@RequestBody Map<String, Integer> body) {
        try {
            int memberId = body.get("memberId");
            int mediaId  = body.get("mediaId");
            int days     = body.get("days");
            return ResponseEntity.ok(transactionService.borrow(memberId, mediaId, days));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/return/{id}")
    public ResponseEntity<?> returnMedia(@PathVariable int id) {
        try {
            return ResponseEntity.ok(transactionService.returnMedia(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/overdue")
    public ResponseEntity<?> markOverdue() {
        return ResponseEntity.ok(transactionService.markOverdue());
    }
    @GetMapping("/fines")
public ResponseEntity<?> getOverdueWithFines() {
    return ResponseEntity.ok(transactionService.getOverdueWithFines());
}

@GetMapping("/fine/{id}")
public ResponseEntity<?> calculateFine(@PathVariable int id) {
    try {
        double fine = transactionService.calculateFine(id);
        Map<String, Object> result = new java.util.HashMap<>();
        result.put("transactionId", id);
        result.put("fineAmount", fine);
        result.put("currency", "INR");
        return ResponseEntity.ok(result);
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }
}

@PutMapping("/fine/{id}/pay")
public ResponseEntity<?> markFinePaid(@PathVariable int id) {
    try {
        return ResponseEntity.ok(transactionService.markFinePaid(id));
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }
}
}