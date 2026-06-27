package com.library.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.library.dao.MediaDAO;
import com.library.dao.MemberDAO;
import com.library.dao.TransactionDAO;
import com.library.model.Media;
import com.library.model.Member;
import com.library.model.Transaction;

@Service
public class TransactionService {

    @Autowired private TransactionDAO transactionDAO;
    @Autowired private MediaDAO mediaDAO;
    @Autowired private MemberDAO memberDAO;

    public List<Transaction> getAll() { return transactionDAO.getAll(); }

    public List<Transaction> getActiveByMember(int memberId) {
        return transactionDAO.getActiveByMember(memberId);
    }

    public String borrow(int memberId, int mediaId, int days) {
        Member member = memberDAO.findById(memberId);
        if (member == null) throw new RuntimeException("Member not found.");
        if (!member.isActive()) throw new RuntimeException("Member account is inactive.");

        Media media = mediaDAO.findById(mediaId);
        if (media == null) throw new RuntimeException("Media not found.");
        if (media.getAvailable() == 0)
            throw new RuntimeException("No copies available for: " + media.getTitle());

        boolean reserved = mediaDAO.decrementAvailable(mediaId);
        if (!reserved) throw new RuntimeException("Could not reserve copy.");

        LocalDate dueDate = LocalDate.now().plusDays(days);
        transactionDAO.add(memberId, mediaId, dueDate);

        return "Borrowed successfully! Due date: " + dueDate;
    }

    public String returnMedia(int transactionId) {
        Transaction txn = transactionDAO.findById(transactionId);
        if (txn == null) throw new RuntimeException("Transaction not found.");
        if ("RETURNED".equals(txn.getStatus()))
            throw new RuntimeException("Already returned.");

        transactionDAO.recordReturn(transactionId);
        mediaDAO.incrementAvailable(txn.getMediaId());
        return "Return recorded successfully!";
    }

    public String markOverdue() {
        int count = transactionDAO.markOverdue();
        return count + " transaction(s) marked as overdue.";
    }
    private static final double FINE_PER_DAY = 5.00; // ₹5 per day

public double calculateFine(int transactionId) {
    Transaction txn = transactionDAO.findById(transactionId);
    if (txn == null) throw new RuntimeException("Transaction not found.");
    if ("RETURNED".equals(txn.getStatus())) return txn.getFineAmount();

    LocalDate today   = LocalDate.now();
    LocalDate dueDate = txn.getDueDate();

    if (today.isAfter(dueDate)) {
        long daysOverdue = java.time.temporal.ChronoUnit.DAYS.between(dueDate, today);
        double fine = daysOverdue * FINE_PER_DAY;
        transactionDAO.updateFine(transactionId, fine);
        return fine;
    }
    return 0.0;
}

public String markFinePaid(int transactionId) {
    transactionDAO.markFinePaid(transactionId);
    return "Fine marked as paid!";
}

public List<Transaction> getOverdueWithFines() {
    List<Transaction> all = transactionDAO.getAll();
    List<Transaction> overdue = new java.util.ArrayList<>();
    for (Transaction t : all) {
        if ("BORROWED".equals(t.getStatus()) || "OVERDUE".equals(t.getStatus())) {
            if (t.getDueDate() != null && LocalDate.now().isAfter(t.getDueDate())) {
                long days = java.time.temporal.ChronoUnit.DAYS.between(t.getDueDate(), LocalDate.now());
                t.setFineAmount(days * FINE_PER_DAY);
                overdue.add(t);
            }
        }
    }
    return overdue;
}
}