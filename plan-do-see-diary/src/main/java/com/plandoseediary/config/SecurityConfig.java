package com.plandoseediary.config;

import com.plandoseediary.service.CustomUserDetailsService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.session.HttpSessionEventPublisher;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomUserDetailsService userDetailsService;


    /*
     * BCrypt 비밀번호 처리
     */
    @Bean
    public PasswordEncoder passwordEncoder() {

        return new BCryptPasswordEncoder();
    }


    /*
     * 세션 생성/삭제 이벤트를
     * Spring Security가 추적할 수 있게 한다.
     */
    @Bean
    public HttpSessionEventPublisher httpSessionEventPublisher() {

        return new HttpSessionEventPublisher();
    }


    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        http
                .userDetailsService(
                        userDetailsService
                )


                /*
                 * 공개 주소
                 */
                .authorizeHttpRequests(auth -> auth

                        .requestMatchers(
                                "/login",
                                "/signup",
                                "/css/**",
                                "/error"
                        )
                        .permitAll()

                        /*
                         * 나머지는 모두 로그인 필수
                         */
                        .anyRequest()
                        .authenticated()
                )


                /*
                 * 로그인
                 */
                .formLogin(form -> form

                        .loginPage(
                                "/login"
                        )

                        .loginProcessingUrl(
                                "/login"
                        )

                        .usernameParameter(
                                "username"
                        )

                        .passwordParameter(
                                "password"
                        )

                        .defaultSuccessUrl(
                                "/",
                                true
                        )

                        /*
                         * 없는 아이디와
                         * 틀린 비밀번호 모두 같은 URL.
                         */
                        .failureUrl(
                                "/login?error"
                        )

                        .permitAll()
                )


                /*
                 * 로그아웃
                 */
                .logout(logout -> logout

                        .logoutUrl(
                                "/logout"
                        )

                        .logoutSuccessUrl(
                                "/login?logout"
                        )

                        /*
                         * 서버 세션 폐기
                         */
                        .invalidateHttpSession(
                                true
                        )

                        .clearAuthentication(
                                true
                        )

                        .deleteCookies(
                                "JSESSIONID"
                        )

                        .permitAll()
                )


                /*
                 * 한 계정에 활성 세션 1개만 허용.
                 *
                 * 같은 계정으로 새 로그인하면
                 * 이전 세션은 만료된다.
                 */
                .sessionManagement(session -> session

                        .maximumSessions(
                                1
                        )
                );


        return http.build();
    }
}