package com.library.model;

/**
 * Represents a library member.
 */
public class Member {
    private int     id;
    private String  name;
    private String  email;
    private String  phone;
    private boolean active;

    public Member() {}

    public Member(String name, String email, String phone) {
        this.name   = name;
        this.email  = email;
        this.phone  = phone;
        this.active = true;
    }

    public int     getId()              { return id; }
    public void    setId(int id)        { this.id = id; }

    public String  getName()            { return name; }
    public void    setName(String n)    { this.name = n; }

    public String  getEmail()           { return email; }
    public void    setEmail(String e)   { this.email = e; }

    public String  getPhone()           { return phone; }
    public void    setPhone(String p)   { this.phone = p; }

    public boolean isActive()           { return active; }
    public void    setActive(boolean a) { this.active = a; }

    @Override
    public String toString() {
        return String.format("[%d] %-25s | %-30s | %s | %s",
            id, name, email, phone, active ? "Active" : "Inactive");
    }
}
