package com.proiect.service;

import com.proiect.entity.User;
import io.quarkus.elytron.security.common.BcryptUtil;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;

@ApplicationScoped
public class AuthService {

    @Transactional
    public User registerUser(String username, String email, String password) {
        // 1. Validare domeniu .edu
        if (email == null || !email.trim().toLowerCase().endsWith(".edu")) {
            throw new BadRequestException("Sunt permise doar adresele de email cu domeniul .edu");
        }

        // 2. Verificare unicitate email și username direct din baza de date
        if (User.count("email", email) > 0) {
            throw new BadRequestException("Acest email este deja înregistrat.");
        }
        if (User.count("username", username) > 0) {
            throw new BadRequestException("Acest username este deja utilizat.");
        }

        // 3. Creare entitate și criptare parolă
        User newUser = new User();
        newUser.username = username;
        newUser.email = email;
        newUser.passwordHash = BcryptUtil.bcryptHash(password); // Hashing securizat

        // 4. Salvare în baza de date PostgreSQL
        newUser.persist();
        
        return newUser;
    }
}