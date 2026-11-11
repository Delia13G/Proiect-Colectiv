package com.proiect.resource;

public class LoginResponse {
    public String token;
    public boolean isStudent;

    public LoginResponse(String token, boolean isStudent) {
        this.token = token;
        this.isStudent = isStudent;
    }
}