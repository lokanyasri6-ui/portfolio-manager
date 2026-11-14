# Let Django talk to MySQL using the pure-Python PyMySQL driver.
# (Much easier to install on Windows than "mysqlclient".)
try:
    import pymysql

    pymysql.install_as_MySQLdb()
except ImportError:  # PyMySQL not installed (e.g. when using SQLite only)
    pass
