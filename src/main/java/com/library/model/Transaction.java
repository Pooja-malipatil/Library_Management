package com.library.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class Transaction {
    private int id;
    private int memberId;
    private int mediaId;
    private LocalDateTime borrowDate;
    private LocalDate dueDate;
    private LocalDateTime returnDate;
    private String status;
    private String memberName;
    private String mediaTitle;

    public Transaction() {}

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public int getMemberId() { return memberId; }
    public void setMemberId(int memberId) { this.memberId = memberId; }
    public int getMediaId() { return mediaId; }
    public void setMediaId(int mediaId) { this.mediaId = mediaId; }
    public LocalDateTime getBorrowDate() { return borrowDate; }
    public void setBorrowDate(LocalDateTime borrowDate) { this.borrowDate = borrowDate; }
    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
    public LocalDateTime getReturnDate() { return returnDate; }
    public void setReturnDate(LocalDateTime returnDate) { this.returnDate = returnDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getMemberName() { return memberName; }
    public void setMemberName(String memberName) { this.memberName = memberName; }
    public String getMediaTitle() { return mediaTitle; }
    public void setMediaTitle(String mediaTitle) { this.mediaTitle = mediaTitle; }
    private double  fineAmount;
    private boolean finePaid;
    public double  getFineAmount()          { return fineAmount; }
    public void    setFineAmount(double f)  { this.fineAmount = f; }
    public boolean isFinePaid()             { return finePaid; }
    public void    setFinePaid(boolean f)   { this.finePaid = f; }
    
}