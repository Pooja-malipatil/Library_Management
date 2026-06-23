package com.library.service;

import com.library.dao.MemberDAO;
import com.library.model.Member;
import com.library.util.InputValidator;

import java.sql.SQLException;
import java.util.List;

/**
 * Business logic layer for library member management.
 * Validates all input before passing to MemberDAO.
 */
public class MemberService {

    private final MemberDAO memberDAO = new MemberDAO();

    public void registerMember(String name, String email, String phone) throws SQLException {
        String n = InputValidator.requireNonBlank(name,  "Name");
        String e = InputValidator.requireValidEmail(email);
        String p = InputValidator.requireNonBlank(phone, "Phone");

        Member member = new Member(n, e, p);
        memberDAO.addMember(member);
        System.out.println("\n✔ Member registered: " + member);
    }

    public void listAllMembers() throws SQLException {
        List<Member> list = memberDAO.getAllMembers();
        if (list.isEmpty()) { System.out.println("No members registered."); return; }
        System.out.println("\n── Registered Members ───────────────────────────────────────────────");
        list.forEach(System.out::println);
        System.out.println("Total: " + list.size());
    }

    public void deactivateMember(String idStr) throws SQLException {
        int id = InputValidator.requirePositiveInt(idStr, "Member ID");
        boolean done = memberDAO.deactivateMember(id);
        System.out.println(done ? "\n✔ Member #" + id + " deactivated." : "Member not found.");
    }

    public MemberDAO getDAO() { return memberDAO; }
}
