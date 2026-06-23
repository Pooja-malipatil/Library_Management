package com.library;

import com.library.service.MediaService;
import com.library.service.MemberService;
import com.library.service.TransactionService;
import com.library.util.DBConnection;

import java.util.Scanner;

/**
 * Entry point for the Relational Library Transaction Ledger.
 * Provides a console-based menu loop.
 */
public class Main {

    private static final Scanner scanner = new Scanner(System.in);
    private static final MediaService       mediaService  = new MediaService();
    private static final MemberService      memberService = new MemberService();
    private static final TransactionService txnService    = new TransactionService();

    public static void main(String[] args) {
        System.out.println("========================================");
        System.out.println("   RELATIONAL LIBRARY TRANSACTION LEDGER");
        System.out.println("========================================");

        boolean running = true;
        while (running) {
            printMenu();
            String choice = scanner.nextLine().trim();
            System.out.println();
            try {
                switch (choice) {
                    // ── Media ──────────────────────────────
                    case "1":  addMedia();          break;
                    case "2":  mediaService.listAllMedia(); break;
                    case "3":  searchMedia();       break;
                    case "4":  filterByType();      break;
                    // ── Members ────────────────────────────
                    case "5":  registerMember();    break;
                    case "6":  memberService.listAllMembers(); break;
                    case "7":  deactivateMember();  break;
                    // ── Transactions ───────────────────────
                    case "8":  borrowMedia();       break;
                    case "9":  returnMedia();       break;
                    case "10": txnService.viewFullLedger(); break;
                    case "11": viewMemberBorrows(); break;
                    case "12": txnService.markOverdueItems(); break;
                    // ── Exit ───────────────────────────────
                    case "0":
                        System.out.println("Closing connection and exiting. Goodbye!");
                        DBConnection.closeConnection();
                        running = false;
                        break;
                    default:
                        System.out.println("Invalid option. Please enter a number from the menu.");
                }
            } catch (IllegalArgumentException | IllegalStateException e) {
                System.out.println("\n[Validation Error] " + e.getMessage());
            } catch (Exception e) {
                System.out.println("\n[Database Error] " + e.getMessage());
            }
        }
        scanner.close();
    }

    // ── Menu ──────────────────────────────────────────────
    private static void printMenu() {
        System.out.println("\n--- MENU ---");
        System.out.println("  MEDIA");
        System.out.println("  1. Add media item");
        System.out.println("  2. View all media");
        System.out.println("  3. Search media");
        System.out.println("  4. Filter by type");
        System.out.println("  MEMBERS");
        System.out.println("  5. Register member");
        System.out.println("  6. View all members");
        System.out.println("  7. Deactivate member");
        System.out.println("  TRANSACTIONS");
        System.out.println("  8.  Borrow media");
        System.out.println("  9.  Return media");
        System.out.println("  10. View full ledger");
        System.out.println("  11. View member's active borrows");
        System.out.println("  12. Mark overdue items");
        System.out.println("  0.  Exit");
        System.out.print("\nEnter choice: ");
    }

    // ── Media helpers ─────────────────────────────────────
    private static void addMedia() throws Exception {
        System.out.print("Title: ");        String title   = scanner.nextLine();
        System.out.print("Creator: ");      String creator = scanner.nextLine();
        System.out.print("Type (BOOK/DVD/MAGAZINE/AUDIOBOOK/OTHER): "); String type = scanner.nextLine();
        System.out.print("Genre: ");        String genre   = scanner.nextLine();
        System.out.print("Release year: "); String year    = scanner.nextLine();
        System.out.print("Total copies: "); String copies  = scanner.nextLine();
        mediaService.addMedia(title, creator, type, genre, year, copies);
    }

    private static void searchMedia() throws Exception {
        System.out.print("Search keyword: ");
        mediaService.searchMedia(scanner.nextLine());
    }

    private static void filterByType() throws Exception {
        System.out.print("Type (BOOK/DVD/MAGAZINE/AUDIOBOOK/OTHER): ");
        mediaService.listByType(scanner.nextLine());
    }

    // ── Member helpers ────────────────────────────────────
    private static void registerMember() throws Exception {
        System.out.print("Name: ");  String name  = scanner.nextLine();
        System.out.print("Email: "); String email = scanner.nextLine();
        System.out.print("Phone: "); String phone = scanner.nextLine();
        memberService.registerMember(name, email, phone);
    }

    private static void deactivateMember() throws Exception {
        System.out.print("Member ID to deactivate: ");
        memberService.deactivateMember(scanner.nextLine());
    }

    // ── Transaction helpers ───────────────────────────────
    private static void borrowMedia() throws Exception {
        System.out.print("Member ID: ");          String memberId = scanner.nextLine();
        System.out.print("Media ID: ");           String mediaId  = scanner.nextLine();
        System.out.print("Loan duration (days): "); String days   = scanner.nextLine();
        txnService.borrowMedia(memberId, mediaId, days);
    }

    private static void returnMedia() throws Exception {
        System.out.print("Transaction ID to return: ");
        txnService.returnMedia(scanner.nextLine());
    }

    private static void viewMemberBorrows() throws Exception {
        System.out.print("Member ID: ");
        txnService.viewActiveBorrows(scanner.nextLine());
    }
}
