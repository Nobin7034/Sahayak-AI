package com.sahayakai.tests;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.junit.jupiter.api.*;
import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.openqa.selenium.support.ui.ExpectedConditions;
import java.time.Duration;
import static org.junit.jupiter.api.Assertions.*;

class HomePageTest {
    private WebDriver driver;
    private WebDriverWait wait;
    private static final String BASE_URL = "http://localhost:3000";
    
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
    void homePage_displaysHeroSectionAndMainElements() {
        driver.get(BASE_URL);
        assertTrue(driver.getTitle().contains("Akshaya Services"));
        WebElement heroTitle = wait.until(ExpectedConditions.presenceOfElementLocated(By.tagName("h1")));
        assertTrue(heroTitle.isDisplayed());
        WebElement getStartedBtn = wait.until(ExpectedConditions.elementToBeClickable(
            By.xpath("//a[contains(text(), 'Get Started') or contains(text(), 'Register')]")));
        assertTrue(getStartedBtn.isDisplayed());
        WebElement loginBtn = driver.findElement(By.xpath("//a[contains(text(), 'Login')]"));
        assertTrue(loginBtn.isDisplayed());
    }
    
    @Test
    void homePage_navigatesToRegisterFromHero() {
        driver.get(BASE_URL);
        WebElement getStartedBtn = wait.until(ExpectedConditions.elementToBeClickable(
            By.xpath("//a[contains(text(), 'Get Started') or contains(text(), 'Register')]")));
        getStartedBtn.click();
        wait.until(ExpectedConditions.urlContains("/register"));
        assertTrue(driver.getCurrentUrl().contains("/register"));
    }
    
    @Test
    void homePage_displaysFeaturesSection() {
        driver.get(BASE_URL);
        WebElement featuresSection = wait.until(ExpectedConditions.presenceOfElementLocated(
            By.xpath("//*[contains(text(), 'Why Choose') or contains(text(), 'Features')]")));
        assertTrue(featuresSection.isDisplayed());
        WebElement featureCard = wait.until(ExpectedConditions.presenceOfElementLocated(
            By.xpath("//*[contains(text(), 'Easy Appointments') or contains(text(), 'Document')]")));
        assertTrue(featureCard.isDisplayed());
    }
}

