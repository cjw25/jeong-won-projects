package com.plandoseediary.service;

import com.plandoseediary.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class AccountService {

    private final CurrentUserService currentUserService;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;


    public void deleteCurrentAccount(
            String password
    ) {

        User user =
                currentUserService
                        .getCurrentUser();


        /*
         * 계정 삭제 전에 현재 비밀번호 확인.
         */
        if (
                !passwordEncoder.matches(
                        password,
                        user.getPasswordHash()
                )
        ) {

            throw new IllegalArgumentException(
                    "현재 비밀번호가 올바르지 않습니다."
            );
        }


        Long userId =
                user.getId();


        /*
         * five_day_experiments가
         * DAY 1 / DAY 2 record를 다시 참조할 수 있으므로
         * 먼저 참조를 끊는다.
         */
        jdbcTemplate.update(
                """
                UPDATE five_day_experiments
                SET rule_change_after_record1_id = NULL,
                    rule_change_after_record2_id = NULL
                WHERE user_id = ?
                """,
                userId
        );


        /*
         * 5일 기록 삭제
         */
        jdbcTemplate.update(
                """
                DELETE FROM five_day_records
                WHERE experiment_id IN (
                    SELECT id
                    FROM five_day_experiments
                    WHERE user_id = ?
                )
                """,
                userId
        );


        jdbcTemplate.update(
                """
                DELETE FROM five_day_experiments
                WHERE user_id = ?
                """,
                userId
        );


        /*
         * Todo 하위 데이터부터 삭제
         */
        jdbcTemplate.update(
                """
                DELETE FROM completion_events
                WHERE todo_id IN (
                    SELECT t.id
                    FROM todos t
                    JOIN plans p
                      ON t.plan_id = p.id
                    WHERE p.owner_id = ?
                )
                """,
                userId
        );


        jdbcTemplate.update(
                """
                DELETE FROM execution_records
                WHERE todo_id IN (
                    SELECT t.id
                    FROM todos t
                    JOIN plans p
                      ON t.plan_id = p.id
                    WHERE p.owner_id = ?
                )
                """,
                userId
        );


        /*
         * Plan 하위 데이터
         */
        jdbcTemplate.update(
                """
                DELETE FROM reviews
                WHERE plan_id IN (
                    SELECT id
                    FROM plans
                    WHERE owner_id = ?
                )
                """,
                userId
        );


        jdbcTemplate.update(
                """
                DELETE FROM plan_revisions
                WHERE plan_id IN (
                    SELECT id
                    FROM plans
                    WHERE owner_id = ?
                )
                """,
                userId
        );


        jdbcTemplate.update(
                """
                DELETE FROM todos
                WHERE plan_id IN (
                    SELECT id
                    FROM plans
                    WHERE owner_id = ?
                )
                """,
                userId
        );


        jdbcTemplate.update(
                """
                DELETE FROM plans
                WHERE owner_id = ?
                """,
                userId
        );


        /*
         * 마지막으로 사용자 계정 삭제.
         */
        jdbcTemplate.update(
                """
                DELETE FROM users
                WHERE id = ?
                """,
                userId
        );
    }
}