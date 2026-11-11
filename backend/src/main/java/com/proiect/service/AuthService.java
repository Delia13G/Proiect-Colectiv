package com.proiect.service;

import com.proiect.entity.User;
import io.quarkus.elytron.security.common.BcryptUtil;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import java.util.List;

@ApplicationScoped
public class AuthService {

    // Lista domeniilor universitare recunoscute
    private static final List<String> VALID_UNIVERSITY_DOMAINS = List.of(
        ".edu", 
        ".edu.ro", 
        ".ac.uk", 
        ".ubbcluj.ro" // Exemplu de domeniu instituțional specific
    );

    @Transactional
    public User registerUser(String username, String email, String studentEmail, String password) {
        
        // 1. Verificare unicitate pentru emailul principal și username
        if (User.count("email", email) > 0) {
            throw new BadRequestException("Acest email este deja înregistrat.");
        }
        if (User.count("username", username) > 0) {
            throw new BadRequestException("Acest username este deja utilizat.");
        }

        // 2. Validare domeniu universitar recunoscut DOAR pentru studentEmail
        if (studentEmail != null && !studentEmail.trim().isEmpty()) {
            String lowerEmail = studentEmail.trim().toLowerCase();
            
            boolean isValidDomain = VALID_UNIVERSITY_DOMAINS.stream()
                                      .anyMatch(lowerEmail::endsWith);

            if (!isValidDomain) {
                throw new BadRequestException("Adresa de email pentru studenți trebuie să aparțină unui domeniu universitar recunoscut.");
            }
            if (User.count("studentEmail", studentEmail) > 0) {
                throw new BadRequestException("Acest email de student este deja înregistrat.");
            }
        }

        // 3. Creare entitate și salvare
        User newUser = new User();
        newUser.username = username;
        newUser.email = email;
        newUser.studentEmail = studentEmail;
        newUser.passwordHash = BcryptUtil.bcryptHash(password);

        newUser.persist();
        return newUser;
    }
}