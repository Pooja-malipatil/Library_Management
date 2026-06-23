package com.library.util;

/**
 * Strict input validation utility.
 * Safeguards the database layer from corrupt data and syntax exceptions — resume bullet 3.
 */
public class InputValidator {

    private InputValidator() {}

    /** Ensures a string is not null or blank. */
    public static String requireNonBlank(String value, String fieldName) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException(fieldName + " must not be blank.");
        }
        return value.trim();
    }

    /** Validates a positive integer (e.g. IDs, copy counts). */
    public static int requirePositiveInt(String raw, String fieldName) {
        try {
            int v = Integer.parseInt(raw.trim());
            if (v <= 0) throw new IllegalArgumentException(fieldName + " must be a positive integer.");
            return v;
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(fieldName + " must be a valid integer, got: \"" + raw + "\"");
        }
    }

    /** Validates a non-negative integer (e.g. available copies). */
    public static int requireNonNegativeInt(String raw, String fieldName) {
        try {
            int v = Integer.parseInt(raw.trim());
            if (v < 0) throw new IllegalArgumentException(fieldName + " must be 0 or greater.");
            return v;
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(fieldName + " must be a valid integer, got: \"" + raw + "\"");
        }
    }

    /** Basic email format check. */
    public static String requireValidEmail(String email) {
        String e = requireNonBlank(email, "Email");
        if (!e.matches("^[\\w.%+\\-]+@[\\w.\\-]+\\.[a-zA-Z]{2,}$")) {
            throw new IllegalArgumentException("Invalid email format: " + e);
        }
        return e;
    }

    /** Validates a 4-digit year between 1800 and current year+1. */
    public static int requireValidYear(String raw) {
        int year = requirePositiveInt(raw, "Year");
        int current = java.time.Year.now().getValue();
        if (year < 1800 || year > current + 1) {
            throw new IllegalArgumentException("Year must be between 1800 and " + (current + 1) + ".");
        }
        return year;
    }

    /** Validates that a media_type string matches the allowed ENUM values. */
    public static String requireValidMediaType(String raw) {
        String t = requireNonBlank(raw, "Media type").toUpperCase();
        switch (t) {
            case "BOOK": case "DVD": case "MAGAZINE": case "AUDIOBOOK": case "OTHER":
                return t;
            default:
                throw new IllegalArgumentException(
                    "Invalid media type: \"" + raw + "\". Allowed: BOOK, DVD, MAGAZINE, AUDIOBOOK, OTHER");
        }
    }

    /** Ensures days-to-due is between 1 and 90. */
    public static int requireValidLoanDays(String raw) {
        int days = requirePositiveInt(raw, "Loan days");
        if (days > 90) throw new IllegalArgumentException("Loan period cannot exceed 90 days.");
        return days;
    }
}