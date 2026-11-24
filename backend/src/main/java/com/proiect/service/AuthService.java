package com.proiect.service;

import com.proiect.entity.User;
import com.proiect.entity.Profile;
import com.proiect.entity.ProfileType;
import io.quarkus.elytron.security.common.BcryptUtil;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import java.util.List;
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

    // Injectarea EntityManager pentru salvarea profilelor (PRO-32)
    @Inject
    EntityManager em;

    @Transactional
    public User registerUser(String username, String email, String studentEmail, String phone, String password) {
        
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

        // 3. Creare entitate utilizator și salvare
        User newUser = new User();
        newUser.username = username;
        newUser.email = email;
        newUser.studentEmail = studentEmail;
        newUser.phone = phone; // Adăugat din main
        newUser.passwordHash = BcryptUtil.bcryptHash(password);

        newUser.persist(); // Salvarea utilizatorului în baza de date
        
        // 4. Generare automată a celor 3 lentile (Profile) pentru noul utilizator (PRO-32)
        Profile dateProfile = new Profile();
dateProfile.type = ProfileType.DATE;
dateProfile.user = newUser;

Profile socialProfile = new Profile();
socialProfile.type = ProfileType.SOCIAL;
socialProfile.user = newUser;

Profile proProfile = new Profile();
proProfile.type = ProfileType.PRO;
proProfile.user = newUser;
        
        // 5. Salvarea lentilelor în baza de date
        em.persist(dateProfile);
        em.persist(socialProfile);
        em.persist(proProfile);
        
        return newUser;
    }

    public String authenticate(String email, String password) {
        // 1. Căutăm utilizatorul după email-ul principal folosind Panache
        User user = User.find("email", email).firstResult();

        // 2. Verificăm dacă utilizatorul a fost găsit și dacă parola introdusă este corectă
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