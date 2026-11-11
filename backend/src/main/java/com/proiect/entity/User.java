package com.proiect.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "users")
public class User extends PanacheEntity {

    @NotBlank(message = "Username-ul este obligatoriu")
    @Column(unique = true, nullable = false)
    public String username;

    @NotBlank(message = "Email-ul este obligatoriu")
    @Email(message = "Formatul email-ului este invalid")
    @Column(unique = true, nullable = false)
    public String email;

    @NotBlank(message = "Parola este obligatorie")
    @Column(name = "password_hash", nullable = false)
    public String passwordHash;

    @Email(message = "Formatul email-ului este invalid")
    @Column(unique = true, nullable = true)
    public String studentEmail; // Adresa de email pentru studenți (opțional)
}