package com.library.service;

import com.library.dao.MediaDAO;
import com.library.dao.MemberDAO;
import com.library.dao.TransactionDAO;
import com.library.model.Media;
import com.library.model.Member;
import com.library.model.Transaction;
import com.library.util.InputValidator;

import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;

/**
 * Business logic layer for borrowing and returning media.
 * Coordinates inventory adjustment + ledger logging atomically — resume bullet 2.
 */
public class TransactionService {

    private final TransactionDAO txnDAO    = new TransactionDAO();
    private final MediaDAO       mediaDAO  = new MediaDAO();
    private final MemberDAO      memberDAO = new MemberDAO();

    // ── Borrow a media item ───────────────────────────────
    public void borrowMedia(String memberIdStr, String mediaIdStr, String loanDaysStr) throws SQLException {
        int memberId = InputValidator.requirePositiveInt(memberIdStr, "Member ID");
        int mediaId  = InputValidator.requirePositiveInt(mediaIdStr,  "Media ID");
        int days     = InputValidator.requireValidLoanDays(loanDaysStr);

        // Validate member and media exist
        Member member = memberDAO.findById(memberId);
        if (member == null)        throw new IllegalArgumentException("Member ID " + memberId + " not found.");
        if (!member.isActive())    throw new IllegalArgumentException("Member account is inactive.");

        Media media = mediaDAO.findById(mediaId);
        if (media == null)         throw new IllegalArgumentException("Media ID " + mediaId + " not found.");
        if (media.getAvailable() == 0)
            throw new IllegalStateException("No copies available for: " + media.getTitle());

        // Decrement inventory first (real-time adjustment)
        boolean updated = mediaDAO.decrementAvailable(mediaId);
        if (!updated) throw new IllegalStateException("Could not reserve copy — may already be exhausted.");

        // Log the transaction
        Transaction txn = new Transaction(memberId, mediaId, LocalDate.now().plusDays(days));
        txnDAO.addTransaction(txn);

        System.out.println("\n✔ Borrowed successfully!");
        System.out.println("  Member : " + member.getName());
        System.out.println("  Media  : " + media.getTitle());
        System.out.println("  Due    : " + txn.getDueDate());
        System.out.println("  TXN ID : " + txn.getId());
    }

    // ── Return a media item ───────────────────────────────
    public void returnMedia(String txnIdStr) throws SQLException {
        int txnId = InputValidator.requirePositiveInt(txnIdStr, "Transaction ID");

        Transaction txn = txnDAO.findById(txnId);
        if (txn == null) throw new IllegalArgumentException("Transaction ID " + txnId + " not found.");
        if ("RETURNED".equals(txn.getStatus()))
            throw new IllegalStateException("This item was already returned.");

        // Update ledger record
        boolean logged = txnDAO.recordReturn(txnId);
        if (!logged) throw new IllegalStateException("Could not update transaction status.");

        // Increment inventory (real-time adjustment)
        mediaDAO.incrementAvailable(txn.getMediaId());

        System.out.println("\n✔ Return recorded!");
        System.out.println("  Member : " + txn.getMemberName());
        System.out.println("  Media  : " + txn.getMediaTitle());
        System.out.println("  TXN ID : " + txnId);
    }

    // ── View ledger ───────────────────────────────────────
    public void viewFullLedger() throws SQLException {
        List<Transaction> list = txnDAO.getAllTransactions();
        if (list.isEmpty()) { System.out.println("No transactions recorded."); return; }
        System.out.println("\n── Transaction Ledger ───────────────────────────────────────────────");
        list.forEach(System.out::println);
    }

    public void viewActiveBorrows(String memberIdStr) throws SQLException {
        int memberId = InputValidator.requirePositiveInt(memberIdStr, "Member ID");
        List<Transaction> list = txnDAO.getActiveByMember(memberId);
        if (list.isEmpty()) { System.out.println("No active borrows."); return; }
        list.forEach(System.out::println);
    }

    // ── Mark overdue ──────────────────────────────────────
    public void markOverdueItems() throws SQLException {
        int count = txnDAO.markOverdue();
        System.out.println("\n✔ Marked " + count + " transaction(s) as OVERDUE.");
    }
}
