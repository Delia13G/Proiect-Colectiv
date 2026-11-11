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

    @Column(name = "first_name")
    public String firstName;

    @Column(name = "last_name")
    public String lastName;

    @Email(message = "Formatul email-ului este invalid")
    @NotBlank(message = "Email-ul este obligatoriu")
    @Column(unique = true, nullable = false)
    public String email;

    @Column(name = "student_email", unique = true, nullable = true)
    public String studentEmail;

    @Column(name = "phone", nullable = true)
    public String phone;

    @NotBlank(message = "Parola este obligatorie")
    @Column(name = "password_hash", nullable = false)
    public String passwordHash;
}