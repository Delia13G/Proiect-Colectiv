package com.tests;

import org.junit.jupiter.api.Test;

import io.quarkus.test.junit.QuarkusTest;
import static io.restassured.RestAssured.given;
import io.restassured.http.ContentType;

@QuarkusTest
public class AuthResourceTest {

    @Test
    public void testLoginWrongPassword() {
        String invalidPayload = "{ \"email\": \"test@test.com\", \"password\": \"gresita\" }";

        given()
          .contentType(ContentType.JSON)
          .body(invalidPayload)
        .when().post("/api/auth/login")
        .then()
             .statusCode(401);
    }

    @Test
    public void testLoginUnregisteredEmail() {
        String invalidPayload = "{ \"email\": \"inexistent@test.com\", \"password\": \"parola123\" }";

        given()
          .contentType(ContentType.JSON)
          .body(invalidPayload)
        .when().post("/api/auth/login")
        .then()
             .statusCode(401);
    }
}