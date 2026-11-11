package com.proiect.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "profiles")
public class Profile extends PanacheEntity {

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    public User user;

    @Column(name = "profile_type", nullable = false)
    public String profileType; 

    @Column(length = 500)
    public String bio;

    // Câmp nou adăugat pentru PRO-35
    @Column(name = "session_state")
    public String sessionState;
}