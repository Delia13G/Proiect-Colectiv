package com.proiect.resource;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;

@QuarkusTest
public class AuthResourceTest {

    

    @Test
    public void testRegisterFailsForNonEduDomain() {
        RegisterRequest request = new RegisterRequest("hacker", "hacker@gmail.com", "HackedPass!");

        given()
            .contentType(ContentType.JSON)
            .body(request)
        .when()
            .post("/api/auth/register")
        .then()
            .statusCode(400); // Bad Request
    }

    @Test
    public void testRegisterFailsForEmptyFields() {
        RegisterRequest request = new RegisterRequest("", "", "");

        given()
            .contentType(ContentType.JSON)
            .body(request)
        .when()
            .post("/api/auth/register")
        .then()
            .statusCode(400); // Bad Request
    }

   @Test
    public void testRegisterSuccessHappyPath() {
        // Generăm un sufix unic pentru a evita duplicatele în baza de date
        String uniqueSuffix = String.valueOf(System.currentTimeMillis());
        String uniqueEmail = "test_happy_" + uniqueSuffix + "@ubbcluj.edu";
        String uniqueUsername = "student_happy_" + uniqueSuffix;
        
        RegisterRequest request = new RegisterRequest(uniqueUsername, uniqueEmail, "SecurePass123!");

        given()
            .contentType(ContentType.JSON)
            .body(request)
        .when()
            .post("/api/auth/register")
        .then()
            .statusCode(201); // Created
    }

    @Test
    public void testRegisterFailsForDuplicateEmail() {
        String uniqueSuffix = String.valueOf(System.currentTimeMillis());
        String duplicateEmail = "duplicate_" + uniqueSuffix + "@ubbcluj.edu";
        
        // Aici username-urile trebuie să fie diferite între ele, dar unice per rulare
        RegisterRequest request1 = new RegisterRequest("user1_" + uniqueSuffix, duplicateEmail, "Pass123!");
        RegisterRequest request2 = new RegisterRequest("user2_" + uniqueSuffix, duplicateEmail, "Pass456!");

        // Primul request ar trebui să treacă (201)
        given()
            .contentType(ContentType.JSON)
            .body(request1)
        .when()
            .post("/api/auth/register")
        .then()
            .statusCode(201);

        // Al doilea request, având același email, trebuie să fie respins (400)
        given()
            .contentType(ContentType.JSON)
            .body(request2)
        .when()
            .post("/api/auth/register")
        .then()
            .statusCode(400);
    }
}