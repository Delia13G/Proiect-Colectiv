package com.proiect.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "profiles")
public class Profile extends PanacheEntity {

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore // Păstrat din PRO-32 pentru a preveni bucle infinite la afișarea JSON-ului
    public User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "profile_type", nullable = false)
    public ProfileType type; // Din PRO-32 (folosind Enum în loc de String)

    @Column(length = 500)
    public String bio; // Din main (PRO-35)

    @Column(name = "session_state")
    public String sessionState; // Din main (PRO-35)
}