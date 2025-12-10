package com.sahayakai.tests;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.junit.jupiter.api.*;
import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.openqa.selenium.support.ui.ExpectedConditions;
import java.time.Duration;
import static org.junit.jupiter.api.Assertions.*;

class DashboardNavigationTest {
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
    void dashboard_displaysMainElements() {
        login();
        driver.get(BASE_URL + "/dashboard");
        WebElement header = wait.until(ExpectedConditions.presenceOfElementLocated(By.tagName("h1")));
        assertTrue(header.isDisplayed());
        WebElement statsCard = wait.until(ExpectedConditions.presenceOfElementLocated(
            By.xpath("//*[contains(text(), 'Completed') or contains(text(), 'Upcoming')]")));
        assertTrue(statsCard.isDisplayed());
        assertTrue(driver.findElement(By.xpath("//*[contains(text(), 'Quick Actions')]")).isDisplayed());
    }
    
    @Test
    void dashboard_navigatesToServicesFromQuickActions() {
        login();
        driver.get(BASE_URL + "/dashboard");
        WebElement servicesLink = wait.until(ExpectedConditions.elementToBeClickable(
            By.xpath("//a[contains(text(), 'Apply for Service')]")));
        servicesLink.click();
        wait.until(ExpectedConditions.urlContains("/services"));
        assertTrue(driver.getCurrentUrl().contains("/services"));
    }
    
    @Test
    void dashboard_navigatesToProfileFromProfileCard() {
        login();
        driver.get(BASE_URL + "/dashboard");
        WebElement profileLink = wait.until(ExpectedConditions.elementToBeClickable(
            By.xpath("//a[contains(text(), 'Edit Profile')]")));
        profileLink.click();
        wait.until(ExpectedConditions.urlContains("/profile"));
        assertTrue(driver.getCurrentUrl().contains("/profile"));
    }
    
    private void login() {
        driver.get(BASE_URL + "/login");
        driver.findElement(By.cssSelector("input[type='email']")).sendKeys(EMAIL);
        driver.findElement(By.cssSelector("input[type='password']")).sendKeys(PASSWORD);
        driver.findElement(By.cssSelector("input[value='user']")).click();
        driver.findElement(By.cssSelector("button[type='submit']")).click();
        wait.until(ExpectedConditions.urlContains("dashboard"));
    }
}

