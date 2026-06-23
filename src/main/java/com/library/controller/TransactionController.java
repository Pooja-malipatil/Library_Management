package com.library.controller;

import com.library.service.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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
}