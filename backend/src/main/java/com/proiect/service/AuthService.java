package com.proiect.service;

import com.proiect.entity.User;
import io.quarkus.elytron.security.common.BcryptUtil;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;
import java.util.List;
import java.util.Map;
import io.smallrye.jwt.build.Jwt;
import java.time.Duration;

@ApplicationScoped
public class AuthService {

    // Lista domeniilor universitare recunoscute
    private static final List<String> VALID_UNIVERSITY_DOMAINS = List.of(
        ".edu", 
        ".edu.ro", 
        ".ac.uk", 
        ".ubbcluj.ro" // Exemplu de domeniu instituțional specific
    );

    private boolean isAcademicDomain(String email) {
        String[] parts = email.trim().toLowerCase().split("@");
        if (parts.length != 2) {
            return false;
        }
        String domain = parts[1];
        return VALID_UNIVERSITY_DOMAINS.stream().anyMatch(domain::endsWith)
                || domain.contains(".edu")
                || domain.contains(".ac.")
                || domain.contains("stud")
                || domain.contains("univ")
                || domain.endsWith("ubbcluj.ro");
    }

    @Transactional
    public User registerUser(String username, String email, String studentEmail, String phone, String password) {
        return registerUser(username, null, null, email, studentEmail, phone, password);
    }

    @Transactional
    public User registerUser(String username, String firstName, String lastName, String email, String studentEmail, String phone, String password) {
        if (email == null || email.trim().isEmpty()) {
            throw new BadRequestException("Email-ul este obligatoriu.");
        }
        if (password == null || password.isEmpty()) {
            throw new BadRequestException("Parola este obligatorie.");
        }

        String normalizedEmail = email.trim().toLowerCase();

        // Generăm automat un username dacă frontend-ul a trimis doar firstName + lastName
        String resolvedUsername = (username != null && !username.trim().isEmpty())
                ? username.trim()
                : normalizedEmail.split("@")[0];

        // 1. Verificare unicitate pentru emailul principal și username
        if (User.count("email", normalizedEmail) > 0) {
            throw new WebApplicationException(
                Response.status(Response.Status.CONFLICT)
                        .entity(Map.of("message", "This email is already registered."))
                        .build()
            );
        }

        if (User.count("username", resolvedUsername) > 0) {
            // Dacă username-ul a fost generat automat din email/nume, îi adăugăm un sufix unic
            if (username == null || username.trim().isEmpty()) {
                resolvedUsername = resolvedUsername + "_" + System.currentTimeMillis();
            } else {
                throw new WebApplicationException(
                    Response.status(Response.Status.CONFLICT)
                            .entity(Map.of("message", "This username is already taken."))
                            .build()
                );
            }
        }

        // 2. Validare domeniu universitar recunoscut DOAR pentru studentEmail
        String normalizedStudentEmail = null;
        if (studentEmail != null && !studentEmail.trim().isEmpty()) {
            normalizedStudentEmail = studentEmail.trim().toLowerCase();

            if (!isAcademicDomain(normalizedStudentEmail)) {
                throw new BadRequestException("Adresa de email pentru studenți trebuie să aparțină unui domeniu universitar recunoscut.");
            }
            if (User.count("studentEmail", normalizedStudentEmail) > 0) {
                throw new WebApplicationException(
                    Response.status(Response.Status.CONFLICT)
                            .entity(Map.of("message", "This academic email is already registered."))
                            .build()
                );
            }
        }

        // 3. Creare entitate și salvare
        User newUser = new User();
        newUser.username = resolvedUsername;
        newUser.firstName = (firstName != null && !firstName.trim().isEmpty()) ? firstName.trim() : null;
        newUser.lastName = (lastName != null && !lastName.trim().isEmpty()) ? lastName.trim() : null;
        newUser.email = normalizedEmail;
        newUser.studentEmail = normalizedStudentEmail;
        newUser.phone = (phone != null && !phone.trim().isEmpty()) ? phone.trim() : null;
        newUser.passwordHash = BcryptUtil.bcryptHash(password);

        newUser.persist();
        return newUser;
    }

    public String authenticate(String email, String password) {
        if (email == null || password == null) {
            return null;
        }
        // 1. Căutăm utilizatorul după email-ul principal folosind Panache
        User user = User.find("email", email.trim().toLowerCase()).firstResult();

        // 2. Verificăm dacă utilizatorul a fost găsit și dacă parola introdusă este corectă
        // Folosim BcryptUtil.matches din Elytron pentru a compara parola raw cu hash-ul
        if (user == null || !BcryptUtil.matches(password, user.passwordHash)) {
            return null; // Returnăm null dacă datele sunt incorecte
        }

        // 3. Verificăm dacă acest utilizator și-a pus o adresă de student la înregistrare
        boolean isStudent = user.studentEmail != null && !user.studentEmail.trim().isEmpty();

        // 4. Generăm token-ul JWT, injectând boolean-ul isStudent cerut de frontend
        return Jwt.issuer("https://cliq.com/issuer")
                .upn(user.email)
                .groups("User")
                .claim("isStudent", isStudent)
                .expiresIn(Duration.ofHours(24))
                .sign();
    }
}