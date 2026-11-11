package com.proiect.resource;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.notNullValue;

@QuarkusTest
public class LensResourceTest {

    @Test
    public void testGetLensesEndpoint() {
        given()
        .when()
            .get("/api/lenses")
        .then()
            .statusCode(200) // Verifies the endpoint is active and doesn't crash
            .contentType(ContentType.JSON) // Verifies the @Produces(MediaType.APPLICATION_JSON) annotation works
            .body(notNullValue()); // Verifies it returns a payload (even an empty list is valid)
    }
}