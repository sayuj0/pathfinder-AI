import json
import os
import random
import subprocess
from pathlib import Path

import pytest
from selenium import webdriver
from selenium.common.exceptions import NoSuchDriverException, WebDriverException
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.edge.service import Service as EdgeService
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

BASE_URL = os.getenv('FRONTEND_URL', 'http://127.0.0.1:5173')
WAIT_SECONDS = int(os.getenv('SELENIUM_WAIT_SECONDS', '12'))
RUNS = int(os.getenv('RANDOM_RUNS', '10'))
RANDOM_SEED = os.getenv('RANDOM_SEED')
SELENIUM_BROWSER = os.getenv('SELENIUM_BROWSER', 'chrome').strip().lower()
HELPER_SCRIPT = Path(__file__).resolve().parent / 'compute_expected_results.mjs'


@pytest.fixture
def driver():
    if SELENIUM_BROWSER == 'edge':
        options = webdriver.EdgeOptions()
        driver_path = os.getenv('MSEDGEDRIVER_PATH')
        service = EdgeService(executable_path=driver_path) if driver_path else None
    else:
        options = webdriver.ChromeOptions()
        driver_path = os.getenv('CHROMEDRIVER_PATH')
        service = ChromeService(executable_path=driver_path) if driver_path else None

    if os.getenv('SELENIUM_HEADLESS', '0') != '0':
        options.add_argument('--headless=new')

    options.add_argument('--window-size=1400,1000')
    options.add_argument('--disable-gpu')

    try:
        if SELENIUM_BROWSER == 'edge':
            browser = webdriver.Edge(options=options, service=service)
        else:
            browser = webdriver.Chrome(options=options, service=service)
    except (NoSuchDriverException, WebDriverException) as error:
        pytest.skip(
            'WebDriver is not available in this environment. '
            'Set CHROMEDRIVER_PATH or MSEDGEDRIVER_PATH to a local driver binary. '
            f'Original error: {error}'
        )

    yield browser
    browser.quit()


def _start_quiz(browser, wait):
    browser.get(BASE_URL)
    wait.until(EC.element_to_be_clickable((By.LINK_TEXT, 'Start Quiz'))).click()
    wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, '.quiz-card__question-text')))


def _choose_random_answer(browser, wait, rng):
    question_text = wait.until(
        EC.visibility_of_element_located((By.CSS_SELECTOR, '.quiz-card__question-text'))
    ).text.strip()

    options = wait.until(
        EC.presence_of_all_elements_located((By.CSS_SELECTOR, '.quiz-card__options .quiz-option'))
    )

    chosen_index = rng.randrange(len(options))
    options[chosen_index].click()

    return {
        'questionText': question_text,
        'answerValue': chosen_index + 1,
    }


def _compute_expected(answer_rows):
    payload = json.dumps(answer_rows)
    output = subprocess.check_output(
        ['node', str(HELPER_SCRIPT), payload],
        text=True,
        cwd=Path(__file__).resolve().parents[1],
    )
    return json.loads(output)


def test_random_answers_match_checkpoint_result(driver):
    rng = random.Random(int(RANDOM_SEED)) if RANDOM_SEED is not None else random.Random()
    wait = WebDriverWait(driver, WAIT_SECONDS)

    for run_index in range(1, RUNS + 1):
        _start_quiz(driver, wait)

        answer_rows = []
        for _ in range(12):
            answer_rows.append(_choose_random_answer(driver, wait, rng))

        wait.until(EC.visibility_of_element_located((By.ID, 'quiz-checkpoint-title')))

        checkpoint_top_career = wait.until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, '.quiz-card__checkpoint-career-title'))
        ).text.strip()

        expected = _compute_expected(answer_rows)
        expected_top_career = expected['top_careers'][0]

        assert checkpoint_top_career == expected_top_career, (
            f'Run {run_index}/{RUNS}: expected checkpoint career "{expected_top_career}", '
            f'got "{checkpoint_top_career}".'
        )
