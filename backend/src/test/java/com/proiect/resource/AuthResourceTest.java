package com.proiect.resource;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.proiect.entity.Lens;
import com.proiect.entity.Profile;
import com.proiect.entity.User;

import io.quarkus.test.junit.QuarkusTest;
import static io.restassured.RestAssured.given;
import io.restassured.http.ContentType;
import jakarta.transaction.Transactional;

@QuarkusTest
public class AuthResourceTest {

    @BeforeEach
    @Transactional
    public void setup() {
        Lens.deleteAll();
        Profile.deleteAll();
        User.deleteAll();
    }

    @Test
    public void testRegisterSuccessWithStandardEmail() {
        String uniqueSuffix = String.valueOf(System.currentTimeMillis());
        // Primary email no longer needs .edu, and studentEmail is null
        RegisterRequest request = new RegisterRequest("user_" + uniqueSuffix, "standard@gmail.com", null, "SecurePass123!");

        given()
                .contentType(ContentType.JSON)
                .body(request)
                .when()
                .post("/api/auth/register")
                .then()
                .statusCode(201);
    }

    @Test
    public void testRegisterSuccessWithStudentEmail() {
        String uniqueSuffix = String.valueOf(System.currentTimeMillis());
        RegisterRequest request = new RegisterRequest("student_" + uniqueSuffix, "personal@yahoo.com", "student_" + uniqueSuffix + "@ubbcluj.edu", "SecurePass123!");

        given()
                .contentType(ContentType.JSON)
                .body(request)
                .when()
                .post("/api/auth/register")
                .then()
                .statusCode(201);
    }

    @Test
    public void testRegisterFailsForInvalidStudentDomain() {
        String uniqueSuffix = String.valueOf(System.currentTimeMillis());
        // studentEmail is provided but doesn't end in .edu
        RegisterRequest request = new RegisterRequest("hacker_" + uniqueSuffix, "hacker@gmail.com", "fake_student@gmail.com", "HackedPass!");

        given()
                .contentType(ContentType.JSON)
                .body(request)
                .when()
                .post("/api/auth/register")
                .then()
                .statusCode(400);
    }
}
