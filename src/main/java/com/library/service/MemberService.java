package com.library.service;

import com.library.dao.MemberDAO;
import com.library.model.Member;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MemberService {

    @Autowired
    private MemberDAO memberDAO;

    public List<Member> getAll() { return memberDAO.getAll(); }

    public Member findById(int id) {
        Member m = memberDAO.findById(id);
        if (m == null) throw new RuntimeException("Member not found with id: " + id);
        return m;
    }

    public String addMember(Member m) {
        if (m.getName() == null || m.getName().isBlank())
            throw new IllegalArgumentException("Name is required.");
        if (m.getEmail() == null || m.getEmail().isBlank())
            throw new IllegalArgumentException("Email is required.");
        memberDAO.add(m);
        return "Member registered successfully!";
    }

    public String deactivate(int id) {
        memberDAO.deactivate(id);
        return "Member deactivated successfully!";
    }
    public String deleteMember(int id) {
    Member m = memberDAO.findById(id);
    if (m == null) throw new RuntimeException("Member not found with id: " + id);
    // Deactivate instead of delete if they have transactions
    memberDAO.deactivate(id);
    return "Member deactivated successfully!";
}
    public List<Member> searchMembers(String keyword) {
        return memberDAO.search(keyword);
    }
    public String activate(int id) {
        memberDAO.activate(id);
        return "Member activated successfully!";
    }
}