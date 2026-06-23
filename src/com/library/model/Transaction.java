package com.library.model;

import java.sql.Timestamp;
import java.time.LocalDate;

/**
 * Represents a single borrow/return transaction — the core of the ledger.
 */
public class Transaction {
    private int       id;
    private int       memberId;
    private int       mediaId;
    private Timestamp borrowDate;
    private LocalDate dueDate;
    private Timestamp returnDate;
    private String    status;      // BORROWED | RETURNED | OVERDUE

    // For display — populated by JOIN queries
    private String memberName;
    private String mediaTitle;

    public Transaction() {}

    public Transaction(int memberId, int mediaId, LocalDate dueDate) {
        this.memberId = memberId;
        this.mediaId  = mediaId;
        this.dueDate  = dueDate;
        this.status   = "BORROWED";
    }

    // ── Getters & Setters ─────────────────────────────────
    public int       getId()                   { return id; }
    public void      setId(int id)             { this.id = id; }

    public int       getMemberId()             { return memberId; }
    public void      setMemberId(int m)        { this.memberId = m; }

    public int       getMediaId()              { return mediaId; }
    public void      setMediaId(int m)         { this.mediaId = m; }

    public Timestamp getBorrowDate()           { return borrowDate; }
    public void      setBorrowDate(Timestamp t){ this.borrowDate = t; }

    public LocalDate getDueDate()              { return dueDate; }
    public void      setDueDate(LocalDate d)   { this.dueDate = d; }

    public Timestamp getReturnDate()           { return returnDate; }
    public void      setReturnDate(Timestamp t){ this.returnDate = t; }

    public String    getStatus()               { return status; }
    public void      setStatus(String s)       { this.status = s; }

    public String    getMemberName()           { return memberName; }
    public void      setMemberName(String n)   { this.memberName = n; }

    public String    getMediaTitle()           { return mediaTitle; }
    public void      setMediaTitle(String t)   { this.mediaTitle = t; }

    @Override
    public String toString() {
        return String.format(
            "TXN#%d | %-20s | %-35s | Borrowed: %-20s | Due: %-12s | %s",
            id,
            memberName != null ? memberName : "Member#" + memberId,
            mediaTitle  != null ? mediaTitle  : "Media#"  + mediaId,
            borrowDate,
            dueDate,
            status);
    }
}
