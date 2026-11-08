package com.proiect.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "lenses")
public class Lens extends PanacheEntity {

    @ManyToOne
    @JoinColumn(name = "profile_id", nullable = false)
    public Profile profile;

    public String name;

    public boolean active;
}