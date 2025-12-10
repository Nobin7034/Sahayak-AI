package com.sahayakai.tests;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.junit.jupiter.api.*;
import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.openqa.selenium.support.ui.ExpectedConditions;
import java.time.Duration;
import static org.junit.jupiter.api.Assertions.*;

class AdditionalFeaturesTest {
    private WebDriver driver;
    private WebDriverWait wait;
    private static final String BASE_URL = "http://localhost:3000";
    private static final String EMAIL = "nobin@gmail.com";
    private static final String PASSWORD = "Nobin@7034";
    
    @BeforeEach
    void setUp() {
        WebDriverManager.chromedriver().setup();
        driver = new ChromeDriver();
        driver.manage().window().setSize(new Dimension(1280, 900));
        wait = new WebDriverWait(driver, Duration.ofSeconds(20));
    }
    
    @AfterEach
    void tearDown() {
        driver.quit();
    }
    
    @Test
    void registerPage_displaysAllFormElements() {
        driver.get(BASE_URL + "/register");
        WebElement firstName = wait.until(ExpectedConditions.presenceOfElementLocated(By.name("firstName")));
        assertTrue(firstName.isDisplayed());
        assertTrue(driver.findElement(By.name("lastName")).isDisplayed());
        assertTrue(driver.findElement(By.name("email")).isDisplayed());
        assertTrue(driver.findElement(By.name("phone")).isDisplayed());
        assertTrue(driver.findElement(By.name("password")).isDisplayed());
        assertTrue(driver.findElement(By.name("confirmPassword")).isDisplayed());
        assertTrue(driver.findElement(By.cssSelector("button[type='submit']")).isDisplayed());
    }
    
    @Test
    void registerPage_validatesFormFields() {
        driver.get(BASE_URL + "/register");
        WebElement email = wait.until(ExpectedConditions.presenceOfElementLocated(By.name("email")));
        email.sendKeys("invalid-email");
        email.sendKeys(Keys.TAB);
        WebElement error = wait.until(ExpectedConditions.presenceOfElementLocated(
            By.xpath("//*[contains(text(), 'valid email') or contains(text(), 'email')]")));
        assertTrue(error.isDisplayed());
    }
    
    @Test
    void dashboard_navigatesAfterLogin() {
        driver.get(BASE_URL + "/login");
        driver.findElement(By.cssSelector("input[type='email']")).sendKeys(EMAIL);
        driver.findElement(By.cssSelector("input[type='password']")).sendKeys(PASSWORD);
        driver.findElement(By.cssSelector("input[value='user']")).click();
        driver.findElement(By.cssSelector("button[type='submit']")).click();
        wait.until(ExpectedConditions.urlContains("dashboard"));
        assertTrue(driver.getCurrentUrl().contains("/dashboard"));
        WebElement navbar = wait.until(ExpectedConditions.presenceOfElementLocated(By.tagName("nav")));
        assertTrue(navbar.isDisplayed());
    }
}

