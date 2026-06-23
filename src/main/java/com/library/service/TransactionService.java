package com.library.service;

import com.library.dao.MediaDAO;
import com.library.dao.MemberDAO;
import com.library.dao.TransactionDAO;
import com.library.model.Member;
import com.library.model.Media;
import com.library.model.Transaction;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

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
}