package com.proiect.resource;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import jakarta.transaction.Transactional;
import com.proiect.entity.User;
import com.proiect.entity.Profile;
import com.proiect.entity.Lens;

import static org.hamcrest.CoreMatchers.notNullValue;
import static org.hamcrest.CoreMatchers.is;
import static io.restassured.RestAssured.given;

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
        RegisterRequest request = new RegisterRequest("user_" + uniqueSuffix, "standard@gmail.com", null,null, "SecurePass123!");

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
        RegisterRequest request = new RegisterRequest("student_" + uniqueSuffix, "personal@yahoo.com", "student_" + uniqueSuffix + "@ubbcluj.edu", "0721123456", "SecurePass123!");

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
        RegisterRequest request = new RegisterRequest("hacker_" + uniqueSuffix, "hacker@gmail.com", "fake_student@gmail.com","0721123456", "HackedPass!");

        given()
            .contentType(ContentType.JSON)
            .body(request)
        .when()
            .post("/api/auth/register")
        .then()
            .statusCode(400); 
    }

    @Test
    public void testLoginFailedUnauthorized() {
        LoginRequest request = new LoginRequest();
        request.email = "inexistent@example.com";
        request.password = "parolaGresita";

        given()
            .contentType(ContentType.JSON)
            .body(request)
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(401); 
    }

    @Test
    public void testLoginSuccess() {
        // Înregistrăm un utilizator temporar valid
        String uniqueSuffix = String.valueOf(System.currentTimeMillis());
        RegisterRequest registerRequest = new RegisterRequest(
                "login_user_" + uniqueSuffix, 
                "login_" + uniqueSuffix + "@example.com", 
                "login_" + uniqueSuffix + "@stud.ubbcluj.ro", 
                "0721123456",
                "Parola123!"
        );

        given()
            .contentType(ContentType.JSON)
            .body(registerRequest)
        .when()
            .post("/api/auth/register")
        .then()
            .statusCode(201);

        // Testăm autentificarea cu contul creat
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.email = "login_" + uniqueSuffix + "@example.com";
        loginRequest.password = "Parola123!";

        given()
            .contentType(ContentType.JSON)
            .body(loginRequest)
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(200) 
            .body("token", notNullValue()) 
            .body("isStudent", is(true)); 
    }
}