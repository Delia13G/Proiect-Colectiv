package com.proiect.resource;

// Un Record în Java 21 generează automat constructorii și getterii necesari pentru Jackson (JSON)
public record RegisterRequest(
    String username,
    String firstName,
    String lastName,
    String email,
    String studentEmail,
    String phone,
    String password
) {
    public RegisterRequest(String username, String email, String studentEmail, String phone, String password) {
        this(username, null, null, email, studentEmail, phone, password);
    }
}
